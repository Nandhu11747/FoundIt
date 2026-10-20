
import math

from django.conf import settings

from .models import Report, Match



def calculate_distance_km(report1, report2):
    """
    Calculate the straight-line distance between two reports
    using their GPS coordinates.

    Returns distance in kilometres, or None if coordinates
    are missing.
    """

    if (
        report1.latitude is None
        or report1.longitude is None
        or report2.latitude is None
        or report2.longitude is None
    ):
        return None

    earth_radius_km = 6371.0

    lat1 = math.radians(float(report1.latitude))
    lon1 = math.radians(float(report1.longitude))
    lat2 = math.radians(float(report2.latitude))
    lon2 = math.radians(float(report2.longitude))

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    # Protect against floating-point rounding errors.
    a = max(0.0, min(1.0, a))

    central_angle = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return earth_radius_km * central_angle



def find_matching_lost_reports(found_report):
    """
    Find Lost Reports that belong to the same category
    as the given Found Report.
    """

    lost_reports = Report.objects.filter(
        type="lost",
        category=found_report.category
    ).exclude(
        user=found_report.user
    )

    return lost_reports

def calculate_match_score(lost_report, found_report):
    """
    Calculate a match score between a Lost Report
    and a Found Report.
    """

    score = 0

    # Item name — 25 points
    if lost_report.item_name.lower() == found_report.item_name.lower():
        score += 25

    # Brand — 15 points
    if (
        lost_report.brand
        and found_report.brand
        and lost_report.brand.lower() == found_report.brand.lower()
    ):
        score += 15

    # Color — 10 points
    if (
        lost_report.color
        and found_report.color
        and lost_report.color.lower() == found_report.color.lower()
    ):
        score += 10


    # Event date — 5 points
    if lost_report.event_date == found_report.event_date:
        score += 5

    # Description — 5 points
    if (
        lost_report.description
        and found_report.description
        and lost_report.description.lower()
        in found_report.description.lower()
    ):
        score += 5

    
    # Category — 25 points
    if lost_report.category.lower() == found_report.category.lower():
        score += 25

   
    # GPS proximity or location-name fallback — up to 15 points
    distance = calculate_distance_km(
        lost_report,
        found_report
    )

    if distance is not None:
        if distance <= 1:
            score += 15
        elif distance <= 3:
            score += 10
        elif distance <= 5:
            score += 5
    elif (
        lost_report.location
        and found_report.location
        and lost_report.location.strip().lower()
        == found_report.location.strip().lower()
    ):
        score += 15

    return score



def create_matches_for_found_report(found_report):
    """
    Find Lost Reports that could match a Found Report
    and create Match records for strong candidates.
    """

    candidates = find_matching_lost_reports(found_report)

    matches_created = []

    for lost_report in candidates:

        score = calculate_match_score(
            lost_report,
            found_report
        )

        if score >= 70:

            match, created = Match.objects.get_or_create(
                lost_report=lost_report,
                found_report=found_report,
                defaults={
                    "match_score": score,
                    "status": "pending",
                }
            )

            if created:
                matches_created.append(match)

    return matches_created

def create_matches_for_lost_report(lost_report):
    """
    Find Found Reports that could match a Lost Report
    and create Match records for strong candidates.
    """

    found_reports = Report.objects.filter(
        type="found",
        category=lost_report.category
    ).exclude(
        user=lost_report.user
    )

    matches_created = []

    for found_report in found_reports:

        score = calculate_match_score(
            lost_report,
            found_report
        )

        if score >= 70:

            match, created = Match.objects.get_or_create(
                lost_report=lost_report,
                found_report=found_report,
                defaults={
                    "match_score": score,
                    "status": "pending",
                }
            )

            if created:
                matches_created.append(match)

    return matches_created