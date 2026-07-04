import google.generativeai as genai
import os
import logging
from apps.analytics.services import AnalyticsService
from apps.academics.models import Student

logger = logging.getLogger(__name__)

class ChatbotService:
    @staticmethod
    def get_ai_response(user, message):
        """
        Takes the user and their message, builds a personalized context,
        and queries the Gemini AI to get a response.
        """
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return "AI Chatbot is currently unavailable because the API key is not configured."

        try:
            # Configure Gemini
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-flash-latest')

            # Fetch student data for context
            try:
                student = Student.objects.get(user=user)
                features = AnalyticsService.extract_features_for_student(student)
                
                # Format context
                gpa = AnalyticsService.compute_actual_gpa(student)
                attendance = features.get('overall_attendance_pct', 0)
                skills_count = features.get('skill_count', 0)
                
                context = (
                    f"Student Name: {user.first_name} {user.last_name}\n"
                    f"Current CGPA: {gpa}\n"
                    f"Overall Attendance: {attendance}%\n"
                    f"Number of Technical Skills: {skills_count}\n"
                )
            except Student.DoesNotExist:
                context = "You are speaking to a staff member or an unknown student role."

            # Construct System Prompt
            system_prompt = (
                "You are the SPMS (Student Placement Management System) AI Assistant. "
                "You are friendly, professional, and concise. "
                "You are specifically designed to help students with their academics, placements, and college policies. "
                "Do NOT answer questions that are entirely unrelated to education, college, programming, or careers. "
                f"Here is the context of the user you are talking to:\n{context}\n\n"
                "Use this context to give personalized advice when they ask about their grades, eligibility, or attendance. "
            )

            # Generate response
            response = model.generate_content(
                f"{system_prompt}\n\nUser Question: {message}"
            )
            
            return response.text

        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later."
