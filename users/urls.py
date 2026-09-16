from django.urls import path
from .views import RegisterView, VerifyOTPView,ResendOTPView, LoginView, GoogleLoginSuccessView, UserMeView
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("resend-otp/",ResendOTPView.as_view(),name="resend-otp"),
    path("login/", LoginView.as_view(), name="login"),
    path("google-login-success/", GoogleLoginSuccessView.as_view(), name="google-login-success"),
    path("me/", UserMeView.as_view(), name="user-me"),
    path("token/refresh/",TokenRefreshView.as_view(),name="token-refresh"),
]
