from django.urls import path
from .views import RegisterView, VerifyOTPView,ResendOTPView, LoginView, GoogleLoginSuccessView, UserMeView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import AdminUserListView
from .views import AdminUserStatusView, ProfileUpdateView
from .views import SavePushSubscriptionView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("resend-otp/",ResendOTPView.as_view(),name="resend-otp"),
    path("login/", LoginView.as_view(), name="login"),
    path("google-login-success/", GoogleLoginSuccessView.as_view(), name="google-login-success"),
    path("me/", UserMeView.as_view(), name="user-me"),
    path("token/refresh/",TokenRefreshView.as_view(),name="token-refresh"),
    path("admin/users/",AdminUserListView.as_view(),name="admin-user-list"),
    path("admin/users/<int:user_id>/status/",AdminUserStatusView.as_view(),name="admin-user-status"),
    path(
        "profile/update/",
        ProfileUpdateView.as_view(),
        name="profile-update",
    ),

    path(
        "push/subscribe/",
        SavePushSubscriptionView.as_view(),
        name="push-subscribe"
    ),
]
