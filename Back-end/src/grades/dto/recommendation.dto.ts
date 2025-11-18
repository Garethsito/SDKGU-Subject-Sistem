// src/grades/dto/recommendation.dto.ts
export class StudentRecommendation {
  name: string;
  studentId: string;
  gpa: number;
  missingCount: number;
}

export class SubjectRecommendation {
  subject: string;
  subjectId: number;
  studentCount: number;
  students: StudentRecommendation[];
}
