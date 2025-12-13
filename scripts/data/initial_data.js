export const initialData = {
  users: [
    {
      id: "teacher_1",
      role: "teacher",
      username: "Teachereman",
      password: "123",
      courseSubject: "Zoology",
    },
    {
      id: "teacher_02",
      role: "teacher",
      username: "Mr.Science",
      password: "456",
      courseSubject: "Botany",
    },
    {
      id: "student_1",
      role: "student",
      username: "TestStudent",
      password: "123",
      grade: 2,
      mobile: "01012345678",
      profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=TestStudent",
    },
  ],
  exams: [
    {
      id: "exam_1",
      creatorId: "teacher_1",
      title: "Dog Breeds Masterclass",
      durationMinutes: 15,
      questions: [
        {
          id: "q_1_1",
          text: "Identify the breed shown in the picture.",
          image: "https://images.dog.ceo/breeds/shihtzu/n02086240_4570.jpg",
          options: ["Shih Tzu", "Bulldog", "Labrador", "Poodle"],
          correctAnswer: "Shih Tzu",
          difficulty: "Easy",
          score: 10,
        },
        {
          id: "q_1_2",
          text: "Which of these dogs is known for sled pulling?",
          image: "https://images.dog.ceo/breeds/husky/n02110185_10047.jpg",
          options: ["Chihuahua", "Husky", "Pug", "Beagle"],
          correctAnswer: "Husky",
          difficulty: "Middle",
          score: 10,
        },
        {
          id: "q_1_3",
          text: "What is the average lifespan of a Golden Retriever?",
          image:
            "https://images.dog.ceo/breeds/retriever-golden/n02099601_10.jpg",
          options: ["5-7 years", "10-12 years", "15-20 years", "1-3 years"],
          correctAnswer: "10-12 years",
          difficulty: "Hard",
          score: 10,
        },
      ],
    },
  ],
  results: [
    {
      id: "result_1",
      studentId: "student_1",
      examId: "exam_1",
      score: 25,
      totalScore: 30,
      date: "2025-12-13T10:00:00Z",
    },
  ],
  assignments: [
    {
      id: "assignment_1",
      creatorId: "teacher_1",
      examId: "exam_1",
      studentId: "student_1",
      status: "pending",
      date: "2025-12-13T10:00:00Z",
    },
  ],
};
