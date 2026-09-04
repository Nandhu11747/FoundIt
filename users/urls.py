from django.urls import path
from .views import RegisterView, VerifyOTPView, LoginView, GoogleLoginSuccessView, UserMeView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("login/", LoginView.as_view(), name="login"),
    path("google-login-success/", GoogleLoginSuccessView.as_view(), name="google-login-success"),
    path("me/", UserMeView.as_view(), name="user-me"),
]
