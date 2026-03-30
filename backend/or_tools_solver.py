from ortools.sat.python import cp_model
from pdf_parser import MinistryPDFParser
from database import SessionLocal
import models

class Lesson:
    def __init__(self, subject: object, teacher: object, room: object, classroom: object, timeslot: object):
        self.subject = subject
        self.teacher = teacher
        self.room = room
        self.classroom = classroom
        self.timeslot = timeslot

    def __repr__(self):
        return f"Lesson(subject='{self.subject.navn}', teacher='{self.teacher.fornavn}', room='{self.room}', classroom='{self.classroom.name}', timeslot={self.timeslot.start_time}, {self.timeslot.day_of_week})"

def main():
    model = cp_model.CpModel()

    db = SessionLocal()

    teachers = db.query(models.Teacher).all()
    teacher_availability = db.query(models.TeacherAvailability).all()
    classrooms = db.query(models.Classroom).all()
    rooms = db.query(models.Room).all()
    subjects = db.query(models.Subject).all()
    timeslots = db.query(models.TimeSlot).all()
    class_subjects = db.query(models.class_subjects).all()
    teacher_subjects = db.query(models.teacher_subjects).all()
    teacher_special_days = db.query(models.teacher_special_days).all()

    db.close()

    parser = MinistryPDFParser()
    url = "https://uvm.dk/media/dfnbhhem/241218-timetalsoversigt-for-skoleaaret-2026-2027-pdf.pdf"
    ministry_requirements = parser.parse_ministry_pdf(url)["grade_requirements"]


    for subject in subjects:
        if subject.navn not in ministry_requirements:
            print(f"Subject {subject.navn} not found in ministry recommendations creating valgfag")
            subject.recommendations = ministry_requirements["Lokalt valgfag"]
        else:
            subject.recommendations = ministry_requirements[subject.navn]


    # setup schedule representation with bools
    schedule = {}
    for c in classrooms:
        for t in timeslots:
            for l in teachers:
                for s in subjects:
                    schedule[(c.id, t.id, l.id, s.id)] = model.NewBoolVar(f"schedule_{c.id}_{t.id}_{l.id}_{s.id}")

    # Constraint: Each timeslot can only have one lesson per classroom
    for t in timeslots:
        for c in classrooms:
            model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for l in teachers for s in subjects) <= 1)

    timeslots_by_day = {}
    for t in timeslots:
        timeslots_by_day.setdefault(t.day_of_week, []).append(t)
    
    for d in timeslots_by_day:
        timeslots_by_day[d].sort(key=lambda x: x.start_time)

    # Constraint: Each lesson should be scheduled 2 times in a day at most unless 4 is required
    slack = model.NewIntVar(0, 2, "slack")
    for s in subjects:
        for c in classrooms:
            for d in timeslots_by_day:
                model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for t in timeslots_by_day[d] for l in teachers) <= 2 + slack)
    
    model.Minimize(slack)

    # Constraint: Each timeslot can only have one lesson if it's not a break
    for t in timeslots:
        if t.is_break:
            for c in classrooms:
                model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for l in teachers for s in subjects) == 0)

    # Constraints from ministry requirements
    for s in subjects:
        for c in classrooms:
            model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for t in timeslots for l in teachers) >= int(s.recommendations[2026 - c.start_year]))


    # Constraint: Each teacher can only teach one subject at a time
    for t in timeslots:
        for l in teachers:
            model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for c in classrooms for s in subjects) <= 1)

    # Constraint: Each classroom can only have one lesson at a time
    for t in timeslots:
        for c in classrooms:
            model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for l in teachers for s in subjects) <= 1)

    # Constraint: Teachers can only teach in their available timeslots
    for t_a in teacher_availability:
        model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for c in classrooms for s in subjects for t in timeslots if t.id == t_a.timeslot_id for l in teachers if l.id == t_a.teacher_id) == 0)

    # Constraint: Teachers can only teach their subjects
    for l in teachers:
        for s in subjects:
            if (l.id, s.id) not in teacher_subjects:
                model.Add(sum(schedule[(c.id, t.id, l.id, s.id)] for c in classrooms for t in timeslots) == 0)
                

    # Constraint: Only one teacher per subject per classroom
    teacher_assignments = {}
    for c in classrooms:
        for l in teachers:
            for s in subjects:
                teacher_assignments[(c.id, l.id, s.id)] = model.NewBoolVar(f"teaches_{c.id}_{l.id}_{s.id}")
    
    # Link: assignment is true if any lesson scheduled for this teacher/subject/classroom combo
    for c in classrooms:
        for l in teachers:
            for s in subjects:
                lessons_for_combo = [schedule[(c.id, t.id, l.id, s.id)] for t in timeslots]
                model.AddMaxEquality(teacher_assignments[(c.id, l.id, s.id)], lessons_for_combo)
    
    # Constrain: at most one teacher per (classroom, subject)
    for c in classrooms:
        for s in subjects:
            model.Add(sum(teacher_assignments[(c.id, l.id, s.id)] for l in teachers) <= 1)


    # Constraint: Minimize gaps in classroom schedule
    for c in classrooms:
        for d, day_slots in timeslots_by_day.items():
            days_lessons = []
            for t in day_slots:
                slot_vars = [schedule[(c.id, t.id, l.id, s.id)] for l in teachers for s in subjects]
                slot_used = model.NewBoolVar(f"slot_used_{c.id}_{t.id}")
                model.Add(sum(slot_vars) == slot_used)

                for v in slot_vars:
                    model.AddImplication(v, slot_used)

                days_lessons.append(slot_used)

            gaps = []

            for i in range(1, len(days_lessons) - 1):
                g = model.NewBoolVar(f"gap_{c.id}_{d}_{i}")

                model.Add(days_lessons[i-1] + days_lessons[i+1] - days_lessons[i] <= 1 + (1 - g)*2)
                model.Add(days_lessons[i-1] + days_lessons[i+1] - days_lessons[i] >= 2*g)

                gaps.append(g)
   
            model.Minimize(sum(gaps))


    # Solve the model
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    lessons = []
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        print("Solution found!")
        for c in classrooms:
            for t in timeslots:
                for l in teachers:
                    for s in subjects:
                        if solver.Value(schedule[(c.id, t.id, l.id, s.id)]):
                            lessons.append(Lesson(s, l, c.room, c, t))
    else:
        print("No solution found")

    return lessons

if __name__ == "__main__":
    main()

