from django.db.models import Avg, Count, Q, F
from .models import Prediction
from .ml_engine import PerformancePredictor
from apps.academics.models import Student, Subject, Batch, Department
from apps.attendance.models import Attendance, ClassSession
from apps.assessments.models import Marks, Assessment, AssignmentTask, AssignmentSubmission
from apps.placements.models import StudentSkill, JobApplication
from apps.common.constants import AttendanceStatus, RiskLevel
import statistics
import logging

logger = logging.getLogger(__name__)

# Thresholds for identifying weak performance
ATTENDANCE_THRESHOLD = 75.0  # Below 75% attendance = weak
MARKS_THRESHOLD = 40.0       # Below 40% marks = weak


class AnalyticsService:

    @staticmethod
    def _get_subject_marks_pct(student, subject):
        """Calculate marks percentage for a student in a specific subject."""
        marks_qs = Marks.objects.filter(
            student=student, assessment__subject=subject
        ).select_related('assessment')
        if not marks_qs.exists():
            return None
        total_obtained = sum(float(m.marks_obtained) for m in marks_qs)
        total_max = sum(float(m.assessment.max_marks) for m in marks_qs)
        return (total_obtained / total_max * 100) if total_max > 0 else 0.0

    @staticmethod
    def _get_subject_attendance_pct(student, subject):
        """Calculate attendance percentage for a student in a subject."""
        total = Attendance.objects.filter(
            student=student, class_session__subject=subject
        ).count()
        if total == 0:
            return None
        present = Attendance.objects.filter(
            student=student, class_session__subject=subject,
            status=AttendanceStatus.PRESENT
        ).count()
        return (present / total * 100)

    @staticmethod
    def extract_features_for_student(student):
        """
        Extract 16 ML features from a student's academic data.
        Returns a dict of feature_name -> value.
        """
        current_sem = student.semester or 1

        # --- Attendance Features ---
        all_att = Attendance.objects.filter(student=student)
        total_sessions = all_att.count()
        present_sessions = all_att.filter(status=AttendanceStatus.PRESENT).count()
        late_count = all_att.filter(status=AttendanceStatus.LATE).count()
        absent_count = all_att.filter(status=AttendanceStatus.ABSENT).count()
        overall_att_pct = (present_sessions / total_sessions * 100) if total_sessions > 0 else 0.0

        # Current semester attendance
        curr_sem_att = all_att.filter(class_session__subject__semester=current_sem)
        curr_total = curr_sem_att.count()
        curr_present = curr_sem_att.filter(status=AttendanceStatus.PRESENT).count()
        curr_sem_att_pct = (curr_present / curr_total * 100) if curr_total > 0 else 0.0

        # Previous semester attendance (for trend)
        prev_sem = current_sem - 1
        prev_sem_att = all_att.filter(class_session__subject__semester=prev_sem)
        prev_total = prev_sem_att.count()
        prev_present = prev_sem_att.filter(status=AttendanceStatus.PRESENT).count()
        
        if curr_total > 0 and prev_total > 0:
            prev_sem_att_pct = (prev_present / prev_total * 100)
            attendance_trend = curr_sem_att_pct - prev_sem_att_pct
        else:
            attendance_trend = 0.0

        # --- Marks Features ---
        all_marks = Marks.objects.filter(student=student).select_related(
            'assessment', 'assessment__subject'
        )
        marks_pcts = []
        for m in all_marks:
            if m.assessment.max_marks > 0:
                marks_pcts.append(float(m.marks_obtained) / float(m.assessment.max_marks) * 100)

        avg_marks_pct = statistics.mean(marks_pcts) if marks_pcts else 0.0
        marks_std_dev = statistics.stdev(marks_pcts) if len(marks_pcts) > 1 else 0.0

        # Current semester marks
        curr_sem_marks = [
            float(m.marks_obtained) / float(m.assessment.max_marks) * 100
            for m in all_marks
            if m.assessment.subject.semester == current_sem and m.assessment.max_marks > 0
        ]
        curr_sem_avg_marks = statistics.mean(curr_sem_marks) if curr_sem_marks else 0.0

        # Previous semester marks (for trend)
        prev_sem_marks = [
            float(m.marks_obtained) / float(m.assessment.max_marks) * 100
            for m in all_marks
            if m.assessment.subject.semester == prev_sem and m.assessment.max_marks > 0
        ]
        
        if curr_sem_marks and prev_sem_marks:
            prev_sem_avg_marks = statistics.mean(prev_sem_marks)
            marks_trend = curr_sem_avg_marks - prev_sem_avg_marks
        else:
            marks_trend = 0.0

        # Internal test avg vs quiz avg
        internal_marks = [
            float(m.marks_obtained) / float(m.assessment.max_marks) * 100
            for m in all_marks
            if m.assessment.assessment_type in ['INTERNAL_1', 'INTERNAL_2', 'INTERNAL_3', 'INTERNAL_4']
            and m.assessment.max_marks > 0
        ]
        quiz_marks = [
            float(m.marks_obtained) / float(m.assessment.max_marks) * 100
            for m in all_marks
            if m.assessment.assessment_type == 'QUIZ' and m.assessment.max_marks > 0
        ]
        internal_avg = statistics.mean(internal_marks) if internal_marks else 0.0
        quiz_avg = statistics.mean(quiz_marks) if quiz_marks else 0.0

        # Subject-level analysis
        enrolled_subjects = student.enrollments.filter(is_active=True).select_related('subject')
        num_enrolled = enrolled_subjects.count()
        subject_pcts = {}
        for enrollment in enrolled_subjects:
            subj = enrollment.subject
            pct = AnalyticsService._get_subject_marks_pct(student, subj)
            if pct is not None:
                subject_pcts[subj.name] = pct

        lowest_subject_pct = min(subject_pcts.values()) if subject_pcts else 0.0
        subjects_below_40 = sum(1 for v in subject_pcts.values() if v < 40)
        subjects_below_60 = sum(1 for v in subject_pcts.values() if v < 60)

        # --- New Features: Assignments ---
        enrolled_subject_ids = enrolled_subjects.values_list('subject_id', flat=True)
        total_assignments = AssignmentTask.objects.filter(subject_id__in=enrolled_subject_ids).count()
        submissions = AssignmentSubmission.objects.filter(student=student)
        submissions_count = submissions.count()
        
        assignment_completion_pct = (submissions_count / total_assignments * 100) if total_assignments > 0 else 0.0
        
        graded_submissions = submissions.filter(marks_obtained__isnull=False).select_related('assignment')
        if graded_submissions.exists():
            assignment_marks_pcts = [
                float(sub.marks_obtained) / float(sub.assignment.max_marks) * 100
                for sub in graded_submissions if sub.assignment.max_marks > 0
            ]
            assignment_avg_marks_pct = statistics.mean(assignment_marks_pcts) if assignment_marks_pcts else 0.0
        else:
            assignment_avg_marks_pct = 0.0

        # --- New Features: Skills & Placements ---
        skills = StudentSkill.objects.filter(student=student)
        skill_count = skills.count()
        avg_skill_proficiency = skills.aggregate(Avg('proficiency'))['proficiency__avg'] or 0.0
        
        job_applications_count = JobApplication.objects.filter(student=student).count()

        return {
            'overall_attendance_pct': round(overall_att_pct, 2),
            'current_sem_attendance_pct': round(curr_sem_att_pct, 2),
            'attendance_trend': round(attendance_trend, 2),
            'total_absent_count': absent_count,
            'avg_marks_pct': round(avg_marks_pct, 2),
            'current_sem_avg_marks': round(curr_sem_avg_marks, 2),
            'marks_trend': round(marks_trend, 2),
            'internal_avg': round(internal_avg, 2),
            'quiz_avg': round(quiz_avg, 2),
            'lowest_subject_pct': round(lowest_subject_pct, 2),
            'subjects_below_40': subjects_below_40,
            'subjects_below_60': subjects_below_60,
            'semester': current_sem,
            'num_enrolled_subjects': num_enrolled,
            'late_count': late_count,
            'marks_std_dev': round(marks_std_dev, 2),
            'assignment_completion_pct': round(assignment_completion_pct, 2),
            'assignment_avg_marks_pct': round(assignment_avg_marks_pct, 2),
            'skill_count': skill_count,
            'avg_skill_proficiency': round(float(avg_skill_proficiency), 2),
            'job_applications_count': job_applications_count,
        }

    @staticmethod
    def compute_actual_gpa(student):
        """
        Compute a student's actual GPA from marks data (ground truth for training).
        Uses the same grading logic as transcript generation.
        """
        from apps.assessments.services import get_grade_and_points
        marks_qs = Marks.objects.filter(student=student).select_related(
            'assessment', 'assessment__subject'
        )
        subject_data = {}
        for m in marks_qs:
            subj_id = m.assessment.subject.id
            if subj_id not in subject_data:
                subject_data[subj_id] = {'obtained': 0.0, 'max': 0.0}
            subject_data[subj_id]['obtained'] += float(m.marks_obtained)
            subject_data[subj_id]['max'] += float(m.assessment.max_marks)

        if not subject_data:
            return 0.0

        total_points = 0
        for subj_id, data in subject_data.items():
            pct = (data['obtained'] / data['max'] * 100) if data['max'] > 0 else 0
            _, points = get_grade_and_points(pct)
            total_points += points

        return round(total_points / len(subject_data), 2)

    @staticmethod
    def extract_features_batch(college):
        """
        Extract features + actual GPA for all students in a college.
        Returns (features_list, gpa_list, student_list) for training.
        """
        students = Student.objects.filter(
            user__college=college
        ).select_related('user', 'batch', 'department')

        features_list = []
        gpa_list = []
        student_list = []

        for student in students:
            features = AnalyticsService.extract_features_for_student(student)
            actual_gpa = AnalyticsService.compute_actual_gpa(student)

            # Only include students with some academic data
            if features['avg_marks_pct'] > 0 or features['overall_attendance_pct'] > 0:
                feature_values = [features[k] for k in sorted(features.keys())]
                features_list.append(feature_values)
                gpa_list.append(actual_gpa)
                student_list.append(student)

        return features_list, gpa_list, student_list

    @staticmethod
    def generate_recommendations(features, predicted_gpa):
        """
        Generate personalized, actionable recommendations
        based on the student's features and predicted GPA.
        """
        recs = []
        att = features.get('overall_attendance_pct', 0)
        curr_att = features.get('current_sem_attendance_pct', 0)
        att_trend = features.get('attendance_trend', 0)
        marks = features.get('avg_marks_pct', 0)
        marks_trend = features.get('marks_trend', 0)
        below_40 = features.get('subjects_below_40', 0)
        below_60 = features.get('subjects_below_60', 0)
        lowest = features.get('lowest_subject_pct', 0)
        quiz_avg = features.get('quiz_avg', 0)
        internal_avg = features.get('internal_avg', 0)
        std_dev = features.get('marks_std_dev', 0)

        # Attendance recommendations
        if att < 75:
            recs.append(
                f"⚠️ Your overall attendance is {att}%. "
                f"Aim for at least 75% to avoid detention."
            )
        if att_trend < -10:
            recs.append(
                "⬇️ Your attendance has dropped significantly "
                "this semester. Stay consistent."
            )

        # Marks recommendations
        if below_40 > 0:
            recs.append(
                f"🚨 You are in the fail zone for {below_40} "
                f"subject(s). Seek help from your teacher immediately."
            )
        if lowest < 50 and lowest > 0:
            recs.append(
                f"📚 Your weakest subject score is {lowest}%. "
                f"Focus extra study time there."
            )
        if marks_trend < -5:
            recs.append(
                "📊 Your marks are trending downward compared "
                "to last semester. Consider revising fundamentals."
            )
        if quiz_avg > 0 and internal_avg > 0 and quiz_avg < internal_avg - 10:
            recs.append(
                "🧪 Your quiz scores are lower than your internal "
                "test scores. Practice regularly between exams."
            )
        if std_dev > 20:
            recs.append(
                "📈 Your marks vary a lot across subjects. "
                "Try to maintain consistent effort in all subjects."
            )

        # Positive reinforcement
        if predicted_gpa >= 8.0:
            recs.append(
                "🌟 Great work! You're on track for an excellent "
                "semester. Keep it up!"
            )
        elif predicted_gpa >= 6.0 and att >= 75:
            recs.append(
                "👍 You're doing well! A little more effort in "
                "weaker subjects can push you higher."
            )

        # Fallback
        if not recs:
            recs.append(
                "✅ No specific concerns detected. Keep up "
                "the good work!"
            )

        return recs

    @staticmethod
    def generate_prediction_for_student(student, predictor=None):
        """
        Extract features, predict GPA, generate recommendations,
        and store everything in the Prediction model.
        """
        features = AnalyticsService.extract_features_for_student(student)

        if predictor is None:
            predictor = PerformancePredictor()

        predicted_gpa = predictor.predict(features)
        risk_level, risk_score = predictor.calculate_risk(predicted_gpa)
        recommendations = AnalyticsService.generate_recommendations(
            features, predicted_gpa
        )

        from django.utils import timezone
        today = timezone.now().date()

        prediction, _ = Prediction.objects.update_or_create(
            student=student,
            prediction_date=today,
            defaults={
                'college': student.user.college,
                'predicted_gpa': predicted_gpa,
                'risk_level': risk_level,
                'risk_score': risk_score,
                'model_version': 'xgb_v2.0' if predictor.is_trained else 'heuristic_v1',
                'recommendations': recommendations,
                'features_snapshot': features,
            }
        )
        return prediction

    @staticmethod
    def trigger_ml_update_async(student_ids):
        """
        Asynchronously triggers ML prediction updates for a list of student IDs.
        Uses threading to avoid blocking the request cycle.
        """
        import threading
        from apps.academics.models import Student

        def _update_task(s_ids):
            from django.db import connection
            try:
                students = Student.objects.filter(id__in=s_ids)
                predictor = PerformancePredictor()
                # If we don't have a globally loaded model, we could train it or just use fallback.
                # Usually predictor loads the saved model on init if available.
                for student in students:
                    try:
                        AnalyticsService.generate_prediction_for_student(student, predictor)
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Async ML update failed for student {student.id}: {e}")
            finally:
                connection.close()

        if student_ids:
            unique_ids = list(set(student_ids))
            thread = threading.Thread(target=_update_task, args=(unique_ids,))
            thread.daemon = True
            thread.start()

    @staticmethod
    def run_batch_predictions(college):
        """
        Train XGBoost on all available data, then predict for every student.
        """
        # Step 1: Extract training data
        features_list, gpa_list, _ = AnalyticsService.extract_features_batch(college)

        # Step 2: Train model
        predictor = PerformancePredictor()
        if features_list:
            predictor.train(features_list, gpa_list)
            logger.info(f"Model trained on {len(features_list)} samples.")

        # Step 3: Predict for all students
        all_students = Student.objects.filter(user__college=college)
        predictions = []
        for student in all_students:
            try:
                pred = AnalyticsService.generate_prediction_for_student(
                    student, predictor
                )
                predictions.append(pred)
            except Exception as e:
                logger.error(f"Prediction failed for {student}: {e}")

        return len(predictions)

    @staticmethod
    def send_proactive_alerts(college):
        """
        Send automated notifications to teachers when their students drop into HIGH RISK.
        """
        from apps.communication.models import Notification
        from django.utils import timezone
        import datetime
        
        today = timezone.now().date()
        high_risk_preds = Prediction.objects.filter(
            student__user__college=college,
            prediction_date=today,
            risk_level=RiskLevel.HIGH
        ).select_related('student__user')
        
        one_week_ago = timezone.now() - datetime.timedelta(days=7)
        alerts_sent = 0
        
        for pred in high_risk_preds:
            student = pred.student
            weak_subjects = AnalyticsService._get_weak_subjects_for_student(student)
            
            for weak_info in weak_subjects:
                subject_id = weak_info['subject_id']
                subject = Subject.objects.select_related('teacher__user').get(id=subject_id)
                teacher = subject.teacher
                
                if teacher and teacher.user:
                    title = f"Action Required: High Risk Student - {student.user.get_full_name()}"
                    recent_alert = Notification.objects.filter(
                        recipient=teacher.user,
                        title=title,
                        created_at__gte=one_week_ago
                    ).exists()
                    
                    if not recent_alert:
                        message = (
                            f"Urgent: {student.user.get_full_name()} (Reg No: {student.user.registration_number}) "
                            f"has dropped into HIGH risk of failure.\n\n"
                            f"They are currently underperforming in your subject '{subject.name}' "
                            f"with {weak_info['attendance_pct']}% attendance and {weak_info['marks_pct']}% marks.\n\n"
                            f"Predicted overall GPA: {pred.predicted_gpa}.\n"
                            f"Please intervene and schedule a mentoring session."
                        )
                        Notification.objects.create(
                            college=college,
                            recipient=teacher.user,
                            title=title,
                            message=message,
                            notification_type='SYSTEM'
                        )
                        alerts_sent += 1
                        
        return alerts_sent

    @staticmethod
    def _get_weak_subjects_for_student(student):
        """
        Identify subjects where a student is underperforming.
        Returns a list of weak subject dicts with attendance and marks info.
        """
        enrollments = student.enrollments.filter(
            is_active=True
        ).select_related('subject__teacher__user')

        weak_subjects = []
        for enrollment in enrollments:
            subject = enrollment.subject

            # Compute attendance % for this subject
            total = ClassSession.objects.filter(subject=subject).count()
            present = Attendance.objects.filter(
                student=student,
                class_session__subject=subject,
                status=AttendanceStatus.PRESENT
            ).count()
            att_pct = (present / total * 100) if total > 0 else None

            # Compute marks % for this subject
            assessments = Assessment.objects.filter(subject=subject)
            marks_qs = Marks.objects.filter(
                student=student, assessment__in=assessments
            ).select_related('assessment')

            if marks_qs.exists():
                total_obtained = sum(m.marks_obtained for m in marks_qs)
                total_max = sum(m.assessment.max_marks for m in marks_qs)
                marks_pct = (
                    float(total_obtained / total_max * 100)
                    if total_max > 0 else None
                )
            else:
                marks_pct = None

            # Check thresholds
            is_weak = (
                (att_pct is not None and att_pct < ATTENDANCE_THRESHOLD)
                or (marks_pct is not None and marks_pct < MARKS_THRESHOLD)
            )

            if is_weak:
                teacher = subject.teacher
                weak_subjects.append({
                    'subject_id': subject.id,
                    'subject_name': subject.name,
                    'subject_code': subject.code,
                    'teacher_name': (
                        teacher.user.get_full_name()
                        if teacher else 'Unassigned'
                    ),
                    'attendance_pct': round(att_pct, 1) if att_pct is not None else None,
                    'marks_pct': round(marks_pct, 1) if marks_pct is not None else None,
                })

        return weak_subjects

    @staticmethod
    def get_admin_analytics(college):
        """
        Build batch → department → at-risk student hierarchy
        with weak subject details for the admin analytics dashboard.
        """
        # Get latest prediction per student using DISTINCT ON (Postgres)
        try:
            latest_preds = (
                Prediction.objects.filter(
                    student__user__college=college,
                    risk_level__in=[RiskLevel.HIGH, RiskLevel.MEDIUM]
                )
                .order_by('student', '-prediction_date', '-id')
                .distinct('student')
                .select_related(
                    'student__user', 'student__batch', 'student__department'
                )
            )
            at_risk = list(latest_preds)
        except Exception:
            # Fallback for SQLite: fetch all, deduplicate in Python
            all_preds = (
                Prediction.objects.filter(
                    student__user__college=college,
                    risk_level__in=[RiskLevel.HIGH, RiskLevel.MEDIUM]
                )
                .order_by('-prediction_date', '-id')
                .select_related(
                    'student__user', 'student__batch', 'student__department'
                )
            )
            seen = set()
            at_risk = []
            for p in all_preds:
                if p.student_id not in seen:
                    seen.add(p.student_id)
                    at_risk.append(p)

        # Build summary
        high_count = sum(1 for p in at_risk if p.risk_level == RiskLevel.HIGH)
        medium_count = sum(
            1 for p in at_risk if p.risk_level == RiskLevel.MEDIUM
        )

        # Group by batch → department
        batch_map = {}
        for pred in at_risk:
            student = pred.student
            batch = student.batch
            dept = student.department

            batch_id = batch.id if batch else 0
            dept_id = dept.id if dept else 0

            if batch_id not in batch_map:
                batch_map[batch_id] = {
                    'id': batch_id,
                    'name': batch.name if batch else 'No Batch',
                    'departments': {},
                }

            dept_map = batch_map[batch_id]['departments']
            if dept_id not in dept_map:
                dept_map[dept_id] = {
                    'id': dept_id,
                    'name': dept.name if dept else 'No Department',
                    'code': dept.code if dept else '—',
                    'students': [],
                }

            weak_subjects = AnalyticsService._get_weak_subjects_for_student(
                student
            )

            dept_map[dept_id]['students'].append({
                'id': student.id,
                'name': student.user.get_full_name(),
                'reg_number': student.user.registration_number,
                'risk_level': pred.risk_level,
                'risk_score': float(pred.risk_score),
                'predicted_gpa': float(pred.predicted_gpa) if pred.predicted_gpa else None,
                'weak_subjects': weak_subjects,
            })

        # Convert maps to lists and compute counts
        batches = []
        for b_data in batch_map.values():
            dept_list = []
            for d_data in b_data['departments'].values():
                d_data['high_count'] = sum(
                    1 for s in d_data['students']
                    if s['risk_level'] == RiskLevel.HIGH
                )
                d_data['medium_count'] = sum(
                    1 for s in d_data['students']
                    if s['risk_level'] == RiskLevel.MEDIUM
                )
                dept_list.append(d_data)
            b_data['departments'] = dept_list
            b_data['high_count'] = sum(d['high_count'] for d in dept_list)
            b_data['medium_count'] = sum(d['medium_count'] for d in dept_list)
            batches.append(b_data)

        return {
            'summary': {
                'total_at_risk': len(at_risk),
                'high': high_count,
                'medium': medium_count,
            },
            'batches': batches,
        }

    @staticmethod
    def _jaccard_similarity(str1, str2):
        """Calculate Jaccard similarity between two strings."""
        set1 = set(str1.lower().split())
        set2 = set(str2.lower().split())
        if not set1 or not set2:
            return 0.0
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        return len(intersection) / len(union)

    @staticmethod
    def get_subject_recommendations(student):
        """
        Recommend unenrolled subjects using NLP similarity and historical marks.
        """
        enrolled = student.enrollments.filter(is_active=True).select_related('subject')
        enrolled_subject_ids = set()
        past_performance = []

        for enrollment in enrolled:
            subj = enrollment.subject
            enrolled_subject_ids.add(subj.id)
            pct = AnalyticsService._get_subject_marks_pct(student, subj)
            if pct is not None:
                past_performance.append({
                    'name': subj.name,
                    'pct': pct
                })

        student_overall_avg = statistics.mean([p['pct'] for p in past_performance]) if past_performance else 50.0

        unenrolled_subjects = Subject.objects.filter(
            college=student.user.college
        ).exclude(id__in=enrolled_subject_ids)

        recommendations = []

        for candidate in unenrolled_subjects:
            all_marks = Marks.objects.filter(assessment__subject=candidate)
            if all_marks.exists():
                hist_pcts = [
                    float(m.marks_obtained) / float(m.assessment.max_marks) * 100
                    for m in all_marks if m.assessment.max_marks > 0
                ]
                subject_historical_avg = statistics.mean(hist_pcts) if hist_pcts else 50.0
            else:
                subject_historical_avg = 50.0

            best_match = None
            best_sim = 0.0
            for past in past_performance:
                sim = AnalyticsService._jaccard_similarity(candidate.name, past['name'])
                if sim > best_sim:
                    best_sim = sim
                    best_match = past

            if best_match and best_sim >= 0.2:
                predicted_pct = (best_match['pct'] * 0.7) + (subject_historical_avg * 0.3)
                reason = f"Based on your strong performance in related subject: {best_match['name']}."
            else:
                predicted_pct = (student_overall_avg * 0.5) + (subject_historical_avg * 0.5)
                reason = "Based on your overall academic trend and subject difficulty."

            predicted_gpa = min(10.0, max(0.0, predicted_pct / 10.0))

            recommendations.append({
                'subject_id': candidate.id,
                'subject_name': candidate.name,
                'subject_code': candidate.code,
                'semester': candidate.semester,
                'predicted_gpa': round(predicted_gpa, 2),
                'reason': reason
            })

        recommendations.sort(key=lambda x: x['predicted_gpa'], reverse=True)
        return recommendations[:3]

    @staticmethod
    def _extract_top_risk_factors(features):
        """
        Analyze features and return top 3 risk factors (XAI).
        """
        if not features:
            return []

        factors = []
        att = features.get('overall_attendance_pct', 100)
        att_trend = features.get('attendance_trend', 0)
        marks = features.get('avg_marks_pct', 100)
        marks_trend = features.get('marks_trend', 0)
        below_40 = features.get('subjects_below_40', 0)
        lowest = features.get('lowest_subject_pct', 100)

        if att < 75:
            factors.append({'factor': f'Low Attendance ({att}%)', 'severity': 'high'})
        if att_trend < -5:
            factors.append({'factor': f'Declining Attendance Trend ({att_trend}%)', 'severity': 'medium'})
        if below_40 > 0:
            factors.append({'factor': f'Failing {below_40} Subjects', 'severity': 'high'})
        if marks < 50:
            factors.append({'factor': f'Poor Overall Marks ({marks}%)', 'severity': 'high'})
        if marks_trend < -5:
            factors.append({'factor': f'Declining Marks Trend ({marks_trend}%)', 'severity': 'medium'})
        if lowest < 40 and below_40 == 0:
            factors.append({'factor': f'Weakest Subject Score ({lowest}%)', 'severity': 'medium'})

        # Sort: High severity first
        factors.sort(key=lambda x: 0 if x['severity'] == 'high' else 1)
        return factors[:3]

    @staticmethod
    def get_teacher_analytics(teacher):
        """
        Return students taught by this teacher who are at risk,
        along with their AI insights (top risk factors).
        """
        from apps.academics.models import Enrollment
        
        # Get students enrolled in this teacher's subjects
        enrollments = Enrollment.objects.filter(
            subject__teacher=teacher,
            is_active=True
        ).select_related('student__user', 'student__batch', 'subject')
        
        student_map = {}
        for enr in enrollments:
            student = enr.student
            if student.id not in student_map:
                student_map[student.id] = {
                    'student': student,
                    'subjects': []
                }
            student_map[student.id]['subjects'].append(enr.subject)
            
        student_ids = list(student_map.keys())
        
        # Fetch latest predictions for these students
        # Using simple approach since distinct() might not work on SQLite
        all_preds = Prediction.objects.filter(
            student_id__in=student_ids,
            risk_level__in=[RiskLevel.HIGH, RiskLevel.MEDIUM]
        ).order_by('-prediction_date', '-id')
        
        seen = set()
        at_risk = []
        for p in all_preds:
            if p.student_id not in seen:
                seen.add(p.student_id)
                at_risk.append(p)
                
        results = []
        for pred in at_risk:
            s_data = student_map[pred.student_id]
            student = s_data['student']
            teacher_subjects = s_data['subjects']
            
            # Extract weak subjects just for this teacher's subjects
            weak_subjects = AnalyticsService._get_weak_subjects_for_student(student)
            my_weak_subjects = [ws for ws in weak_subjects if ws['subject_id'] in [sub.id for sub in teacher_subjects]]
            
            top_factors = AnalyticsService._extract_top_risk_factors(pred.features_snapshot)
            
            results.append({
                'id': student.id,
                'name': student.user.get_full_name(),
                'reg_number': student.user.registration_number,
                'batch': student.batch.name if student.batch else 'N/A',
                'risk_level': pred.risk_level,
                'predicted_gpa': float(pred.predicted_gpa) if pred.predicted_gpa else None,
                'top_risk_factors': top_factors,
                'my_weak_subjects': my_weak_subjects,
            })
            
        # Sort by risk (HIGH first)
        results.sort(key=lambda x: 0 if x['risk_level'] == RiskLevel.HIGH else 1)
        
        return {
            'total_students_taught': len(student_ids),
            'at_risk_students': results,
            'high_count': sum(1 for r in results if r['risk_level'] == RiskLevel.HIGH),
            'medium_count': sum(1 for r in results if r['risk_level'] == RiskLevel.MEDIUM),
        }

    @staticmethod
    def get_student_insights(student):
        """
        Returns the student's latest prediction with recommendations,
        feature breakdown, and subject-level performance.
        """
        from apps.analytics.models import Prediction
        # Get or generate latest prediction
        prediction = Prediction.objects.filter(student=student).order_by('-prediction_date', '-id').first()

        if not prediction:
            # Generate on-the-fly if none exists
            prediction = AnalyticsService.generate_prediction_for_student(student)

        # Build subject-level performance data
        weak_subjects = AnalyticsService._get_weak_subjects_for_student(student)

        # Semester progression (GPA per semester from features)
        from apps.assessments.services import get_grade_and_points
        from apps.assessments.models import Marks
        marks_qs = Marks.objects.filter(student=student).select_related(
            'assessment', 'assessment__subject'
        )
        semester_gpas = {}
        for m in marks_qs:
            sem = m.assessment.subject.semester
            if sem not in semester_gpas:
                semester_gpas[sem] = {}
            subj_id = m.assessment.subject.id
            if subj_id not in semester_gpas[sem]:
                semester_gpas[sem][subj_id] = {'obtained': 0.0, 'max': 0.0}
            semester_gpas[sem][subj_id]['obtained'] += float(m.marks_obtained)
            semester_gpas[sem][subj_id]['max'] += float(m.assessment.max_marks)

        progression = []
        for sem in sorted(semester_gpas.keys()):
            total_points = 0
            count = 0
            for data in semester_gpas[sem].values():
                pct = (data['obtained'] / data['max'] * 100) if data['max'] > 0 else 0
                _, points = get_grade_and_points(pct)
                total_points += points
                count += 1
            sgpa = round(total_points / count, 2) if count > 0 else 0
            progression.append({'semester': sem, 'sgpa': sgpa})

        return {
            'prediction': {
                'predicted_gpa': float(prediction.predicted_gpa) if prediction.predicted_gpa else 0,
                'risk_level': prediction.risk_level,
                'risk_score': float(prediction.risk_score),
                'model_version': prediction.model_version,
                'prediction_date': str(prediction.prediction_date),
            },
            'recommendations': prediction.recommendations or [],
            'features': prediction.features_snapshot or {},
            'weak_subjects': weak_subjects,
            'semester_progression': progression,
        }
