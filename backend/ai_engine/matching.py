def calculate_match_score(profile, scholarship):
    """
    Calculates a dynamic, weighted match score and detailed eligibility breakdown
    between a student profile and a scholarship's requirements.
    
    Returns:
        score: int (0 to 100)
        details: dict containing breakdown, category_scores, eligibility_percentage, and eligibility_status
    """
    if not hasattr(scholarship, 'requirements') or not scholarship.requirements:
        return 100, {
            "category_scores": {"Academic": 100, "Income": 100, "Course": 100, "Location": 100, "Category": 100},
            "eligibility_percentage": 100,
            "eligibility_status": "ELIGIBLE",
            "matched_criteria": ["All general criteria satisfied."],
            "unmet_criteria": [],
            "missing_information": [],
            "uncertain_criteria": []
        }

    req = scholarship.requirements
    total_criteria = 0
    passed_criteria = 0
    has_unmet = False
    has_missing = False

    matched_criteria = []
    unmet_criteria = []
    missing_information = []
    uncertain_criteria = []
    category_scores = {}

    # 1. CGPA / Academic Check
    if req.min_cgpa:
        total_criteria += 1
        if profile.cgpa is not None:
            if profile.cgpa >= req.min_cgpa:
                passed_criteria += 1
                category_scores['Academic'] = 100
                matched_criteria.append(f"CGPA ({profile.cgpa}) meets minimum requirement ({req.min_cgpa})")
            else:
                category_scores['Academic'] = int((profile.cgpa / req.min_cgpa) * 100)
                unmet_criteria.append(f"CGPA ({profile.cgpa}) is below required minimum ({req.min_cgpa})")
                has_unmet = True
        else:
            category_scores['Academic'] = 50
            missing_information.append("Academic CGPA is required but missing in your profile")
            has_missing = True
    else:
        category_scores['Academic'] = 100

    # 2. Family Income Check
    if req.max_income:
        total_criteria += 1
        if profile.annual_family_income is not None:
            if profile.annual_family_income <= req.max_income:
                passed_criteria += 1
                category_scores['Income'] = 100
                matched_criteria.append(f"Annual Family Income (₹{profile.annual_family_income:,.0f}) is within the limit (₹{req.max_income:,.0f})")
            else:
                category_scores['Income'] = 0
                unmet_criteria.append(f"Income (₹{profile.annual_family_income:,.0f}) exceeds maximum limit (₹{req.max_income:,.0f})")
                has_unmet = True
        else:
            category_scores['Income'] = 50
            missing_information.append("Family income is required but missing in your profile")
            has_missing = True
    else:
        category_scores['Income'] = 100

    # 3. Gender Check
    if req.gender_eligibility and req.gender_eligibility.lower() != 'all':
        total_criteria += 1
        if profile.gender:
            if profile.gender.lower() == req.gender_eligibility.lower():
                passed_criteria += 1
                category_scores['Gender'] = 100
                matched_criteria.append(f"Gender ({profile.gender}) meets requirement ({req.gender_eligibility})")
            else:
                category_scores['Gender'] = 0
                unmet_criteria.append(f"Scheme restricted to {req.gender_eligibility} applicants (Profile: {profile.gender})")
                has_unmet = True
        else:
            category_scores['Gender'] = 50
            missing_information.append("Gender is missing in your profile")
            has_missing = True
    else:
        category_scores['Gender'] = 100

    # 4. Course & Branch Check
    if req.course:
        total_criteria += 1
        courses = [c.strip().lower() for c in req.course.split(',')]
        prof_course = (profile.course or '').lower()
        prof_branch = (profile.branch or '').lower()
        comb_course = f"{prof_course} {prof_branch}".strip()

        matched = any(
            c in prof_course or prof_course in c or
            c in prof_branch or prof_branch in c or
            c in comb_course
            for c in courses
        )
        if prof_course or prof_branch:
            if matched:
                passed_criteria += 1
                category_scores['Course'] = 100
                matched_criteria.append(f"Enrolled in eligible course/branch ({profile.course or ''} {profile.branch or ''})".strip())
            else:
                category_scores['Course'] = 0
                unmet_criteria.append(f"Course/Branch ({profile.course or ''} {profile.branch or ''}) not in eligible list ({req.course})".strip())
                has_unmet = True
        else:
            category_scores['Course'] = 50
            missing_information.append("Course/Branch is missing in your profile")
            has_missing = True
    else:
        category_scores['Course'] = 100

    # 5. State / Location Check
    if req.state_eligibility:
        total_criteria += 1
        states = [s.strip().lower() for s in req.state_eligibility.split(',')]
        if profile.state:
            if any(s in profile.state.lower() or profile.state.lower() in s for s in states) or 'all' in states:
                passed_criteria += 1
                category_scores['Location'] = 100
                matched_criteria.append(f"State of domicile ({profile.state}) matches eligibility")
            else:
                category_scores['Location'] = 0
                unmet_criteria.append(f"State ({profile.state}) not in eligible states ({req.state_eligibility})")
                has_unmet = True
        else:
            category_scores['Location'] = 50
            missing_information.append("State is missing in your profile")
            has_missing = True
    else:
        category_scores['Location'] = 100

    # 6. Category / Diversity Check
    if req.category_eligibility:
        total_criteria += 1
        cats = [c.strip().lower() for c in req.category_eligibility.split(',')]
        if profile.category:
            if any(c in profile.category.lower() or profile.category.lower() in c for c in cats) or 'all' in cats or 'general' in cats:
                passed_criteria += 1
                category_scores['Category'] = 100
                matched_criteria.append(f"Category ({profile.category}) is eligible")
            else:
                category_scores['Category'] = 0
                unmet_criteria.append(f"Category ({profile.category}) not eligible for this scheme")
                has_unmet = True
        else:
            category_scores['Category'] = 50
            missing_information.append("Category is missing in your profile")
            has_missing = True
    else:
        category_scores['Category'] = 100

    # Overall Metrics Calculation
    if total_criteria > 0:
        eligibility_percentage = int((passed_criteria / total_criteria) * 100)
    else:
        eligibility_percentage = 100

    if has_unmet:
        eligibility_status = "NOT_ELIGIBLE"
    elif has_missing:
        eligibility_status = "NEEDS_INFORMATION"
    else:
        eligibility_status = "ELIGIBLE"

    # Explainability: Overall Match score average across categories
    match_score = int(sum(category_scores.values()) / len(category_scores))

    return match_score, {
        "category_scores": category_scores,
        "eligibility_percentage": eligibility_percentage,
        "eligibility_status": eligibility_status,
        "matched_criteria": matched_criteria,
        "unmet_criteria": unmet_criteria,
        "missing_information": missing_information,
        "uncertain_criteria": uncertain_criteria
    }
