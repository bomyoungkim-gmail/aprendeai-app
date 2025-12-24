from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from admin.service import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])

# In production, add authentication/authorization middleware
# def verify_admin_role(token: str = Depends(get_current_user)):
#     if user.role not in ["TEACHER", "ADMIN"]:
#         raise HTTPException(status_code=403, detail="Admin access required")

@router.get("/class/{class_id}/overview")
async def get_class_overview(class_id: str):
    """
    Get class overview with student roster and aggregate stats.
    Requires: Teacher/Admin role
    """
    try:
        overview = admin_service.get_class_overview(class_id)
        return overview
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/student/{user_id}/detail")
async def get_student_detail(user_id: str):
    """
    Get detailed progress report for a student.
    Requires: Teacher/Admin role
    """
    try:
        detail = admin_service.get_student_detail(user_id)
        return detail
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/class/{class_id}/students")
async def get_class_students(class_id: str):
    """
    Get list of students in a class.
    Requires: Teacher/Admin role
    """
    try:
        students = admin_service.get_class_students(class_id)
        return {"class_id": class_id, "students": students, "count": len(students)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/institution/{institution_id}/dashboard")
async def get_institution_dashboard(institution_id: str):
    """
    Get institution-wide analytics.
    Requires: Admin role
    """
    try:
        dashboard = admin_service.get_institution_dashboard(institution_id)
        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/class/{class_id}/report")
async def generate_class_report(
    class_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Generate comprehensive class report for date range.
    Requires: Teacher/Admin role
    """
    try:
        report = admin_service.generate_class_report(class_id, start_date, end_date)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/classes/my-classes/{teacher_id}")
async def get_teacher_classes(teacher_id: str):
    """
    Get all classes assigned to a teacher.
    Requires: Teacher role
    
    NOTE: Mock implementation - would query Class model with teacherId filter
    """
    # Mock response
    return {
        "teacher_id": teacher_id,
        "classes": [
            {
                "class_id": "class_1",
                "name": "8º A - Ciências",
                "student_count": 25,
                "grade_level": "8_EF"
            },
            {
                "class_id": "class_2",
                "name": "9º B - Ciências",
                "student_count": 28,
                "grade_level": "9_EF"
            }
        ]
    }
