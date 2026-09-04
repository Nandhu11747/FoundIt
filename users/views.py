from rest_framework.authentication import SessionAuthentication
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, EmailVerification
from .serializers import RegisterSerializer, LoginSerializer
from .utils import generate_otp
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import redirect



class RegisterView(APIView):

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data

        otp = generate_otp()

        password_hash = make_password(
            data["password"]
        )

        expires_at = timezone.now() + timedelta(minutes=5)

        EmailVerification.objects.filter(
            email=data["email"]
        ).delete()

        verification = EmailVerification.objects.create(
            email=data["email"],
            otp=otp,
            full_name=data["full_name"],
            phone=data["phone"],
            password_hash=password_hash,
            expires_at=expires_at
        )

        send_mail(
            subject="FoundIt Email Verification",
            message=f"Your FoundIt verification OTP is: {otp}",
            from_email=None,
            recipient_list=[verification.email],
        )

        return Response(
            {
                "message": "OTP sent successfully"
            },
            status=status.HTTP_200_OK
        )


class VerifyOTPView(APIView):

    def post(self, request):

        email = request.data.get("email")
        otp = request.data.get("otp")

        if not email or not otp:
            return Response(
                {
                    "error": "Email and OTP are required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            verification = EmailVerification.objects.get(
                email=email
            )
        except EmailVerification.DoesNotExist:
            return Response(
                {
                    "error": "No OTP verification found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if timezone.now() > verification.expires_at:
            verification.delete()

            return Response(
                {
                    "error": "OTP has expired"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if verification.otp != otp:
            return Response(
                {
                    "error": "Invalid OTP"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create(
            email=verification.email,
            full_name=verification.full_name,
            phone=verification.phone,
            password=verification.password_hash,
            status="active"
        )

        verification.delete()

        return Response(
            {
                "message": "Email verified and account created successfully",
                "user_id": user.id,
                "email": user.email
            },
            status=status.HTTP_201_CREATED
        )



class LoginView(APIView):

    def post(self, request):

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "full_name": user.full_name,
                        "email": user.email,
                    }
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class GoogleLoginSuccessView(APIView):

    authentication_classes = [
        SessionAuthentication
    ]

    def get(self, request):

        if not request.user.is_authenticated:
            return Response(
                {
                    "error": "Google authentication failed"
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = request.user

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Google login successful",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "full_name": user.full_name,
                    "email": user.email,
                }
            },
            status=status.HTTP_200_OK
        )

class UserMeView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        return Response(
            {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "location": user.location,
                "profile_photo": user.profile_photo,
            },
            status=status.HTTP_200_OK
        )