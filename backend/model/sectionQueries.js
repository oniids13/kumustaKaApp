const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Generate a unique 6-character section code
 */
const generateSectionCode = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existing = await prisma.section.findUnique({
      where: { code },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return code;
};

/**
 * Get all sections
 */
const getAllSections = async () => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        counselors: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            counselors: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sections.map((section) => ({
      id: section.id,
      name: section.name,
      code: section.code,
      description: section.description,
      gradeLevel: section.gradeLevel,
      isActive: section.isActive,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
      teacher: section.teacher
        ? {
            id: section.teacher.id,
            userId: section.teacher.userId,
            firstName: section.teacher.user.firstName,
            lastName: section.teacher.user.lastName,
            email: section.teacher.user.email,
          }
        : null,
      counselors: section.counselors.map((c) => ({
        id: c.id,
        userId: c.userId,
        firstName: c.user.firstName,
        lastName: c.user.lastName,
        email: c.user.email,
      })),
      studentCount: section._count.students,
      counselorCount: section._count.counselors,
    }));
  } catch (error) {
    console.error("Error fetching sections:", error);
    throw error;
  }
};

/**
 * Get section by ID
 */
const getSectionById = async (id) => {
  try {
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                gender: true,
              },
            },
          },
        },
        counselors: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      return null;
    }

    return section;
  } catch (error) {
    console.error("Error fetching section:", error);
    throw error;
  }
};

/**
 * Get section by code
 */
const getSectionByCode = async (code) => {
  try {
    const section = await prisma.section.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return section;
  } catch (error) {
    console.error("Error fetching section by code:", error);
    throw error;
  }
};

/**
 * Create a new section
 */
const createSection = async (sectionData) => {
  try {
    const { name, description, gradeLevel } = sectionData;

    // Generate unique code
    const code = await generateSectionCode();

    const section = await prisma.section.create({
      data: {
        name,
        code,
        description,
        gradeLevel,
      },
    });

    return section;
  } catch (error) {
    console.error("Error creating section:", error);
    throw error;
  }
};

/**
 * Update a section
 */
const updateSection = async (id, sectionData) => {
  try {
    const { name, description, gradeLevel, isActive } = sectionData;

    const section = await prisma.section.update({
      where: { id },
      data: {
        name,
        description,
        gradeLevel,
        isActive,
      },
    });

    return section;
  } catch (error) {
    console.error("Error updating section:", error);
    throw error;
  }
};

/**
 * Delete a section
 */
const deleteSection = async (id) => {
  try {
    // First, remove the section from all students and teacher
    await prisma.student.updateMany({
      where: { sectionId: id },
      data: { sectionId: null },
    });

    await prisma.teacher.updateMany({
      where: { sectionId: id },
      data: { sectionId: null },
    });

    // Remove counselor associations
    const section = await prisma.section.findUnique({
      where: { id },
      include: { counselors: true },
    });

    if (section) {
      await prisma.section.update({
        where: { id },
        data: {
          counselors: {
            disconnect: section.counselors.map((c) => ({ id: c.id })),
          },
        },
      });
    }

    // Now delete the section
    await prisma.section.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    console.error("Error deleting section:", error);
    throw error;
  }
};

/**
 * Regenerate section code
 */
const regenerateSectionCode = async (id) => {
  try {
    const newCode = await generateSectionCode();

    const section = await prisma.section.update({
      where: { id },
      data: { code: newCode },
    });

    return section;
  } catch (error) {
    console.error("Error regenerating section code:", error);
    throw error;
  }
};

/**
 * Assign teacher to section
 */
const assignTeacherToSection = async (sectionId, teacherId) => {
  try {
    // First, check if teacher is already assigned to another section
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (teacher && teacher.sectionId && teacher.sectionId !== sectionId) {
      throw new Error("Teacher is already assigned to another section");
    }

    // Update teacher's section
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { sectionId },
    });

    return await getSectionById(sectionId);
  } catch (error) {
    console.error("Error assigning teacher to section:", error);
    throw error;
  }
};

/**
 * Remove teacher from section
 */
const removeTeacherFromSection = async (sectionId) => {
  try {
    await prisma.teacher.updateMany({
      where: { sectionId },
      data: { sectionId: null },
    });

    return await getSectionById(sectionId);
  } catch (error) {
    console.error("Error removing teacher from section:", error);
    throw error;
  }
};

/**
 * Join section with code (for students)
 */
const joinSectionWithCode = async (studentId, code) => {
  try {
    const section = await prisma.section.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!section) {
      throw new Error("Invalid section code");
    }

    if (!section.isActive) {
      throw new Error("This section is not active");
    }

    // Update student's section
    const student = await prisma.student.update({
      where: { id: studentId },
      data: { sectionId: section.id },
      include: {
        section: true,
      },
    });

    return student;
  } catch (error) {
    console.error("Error joining section:", error);
    throw error;
  }
};

/**
 * Join section with code (for teachers)
 */
const teacherJoinSectionWithCode = async (teacherId, code) => {
  try {
    const section = await prisma.section.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!section) {
      throw new Error("Invalid section code");
    }

    if (!section.isActive) {
      throw new Error("This section is not active");
    }

    // Check if section already has a teacher
    const existingTeacher = await prisma.teacher.findFirst({
      where: { sectionId: section.id },
    });

    if (existingTeacher && existingTeacher.id !== teacherId) {
      throw new Error("This section already has a teacher assigned");
    }

    // Update teacher's section
    const teacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: { sectionId: section.id },
      include: {
        section: true,
      },
    });

    return teacher;
  } catch (error) {
    console.error("Error teacher joining section:", error);
    throw error;
  }
};

/**
 * Join section with code (for counselors - many-to-many)
 */
const counselorJoinSectionWithCode = async (counselorId, code) => {
  try {
    const section = await prisma.section.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!section) {
      throw new Error("Invalid section code");
    }

    if (!section.isActive) {
      throw new Error("This section is not active");
    }

    // Add counselor to section
    await prisma.section.update({
      where: { id: section.id },
      data: {
        counselors: {
          connect: { id: counselorId },
        },
      },
    });

    // Get updated counselor with sections
    const counselor = await prisma.counselor.findUnique({
      where: { id: counselorId },
      include: {
        sections: true,
      },
    });

    return counselor;
  } catch (error) {
    console.error("Error counselor joining section:", error);
    throw error;
  }
};

/**
 * Leave section (for students)
 */
const leaveSection = async (studentId) => {
  try {
    const student = await prisma.student.update({
      where: { id: studentId },
      data: { sectionId: null },
    });

    return student;
  } catch (error) {
    console.error("Error leaving section:", error);
    throw error;
  }
};

/**
 * Get available teachers (not assigned to any section)
 */
const getAvailableTeachers = async () => {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { sectionId: null },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return teachers.map((t) => ({
      id: t.id,
      userId: t.userId,
      firstName: t.user.firstName,
      lastName: t.user.lastName,
      email: t.user.email,
    }));
  } catch (error) {
    console.error("Error fetching available teachers:", error);
    throw error;
  }
};

/**
 * Get all counselors (with their current section assignments)
 */
const getAllCounselors = async () => {
  try {
    const counselors = await prisma.counselor.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sections: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return counselors.map((c) => ({
      id: c.id,
      userId: c.userId,
      firstName: c.user.firstName,
      lastName: c.user.lastName,
      email: c.user.email,
      sectionCount: c.sections.length,
      sections: c.sections,
    }));
  } catch (error) {
    console.error("Error fetching counselors:", error);
    throw error;
  }
};

/**
 * Assign counselor to section (admin action)
 */
const assignCounselorToSection = async (sectionId, counselorId) => {
  try {
    // Check if counselor is already assigned to this section
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        counselors: { select: { id: true } },
      },
    });

    if (!section) {
      throw new Error("Section not found");
    }

    const alreadyAssigned = section.counselors.some((c) => c.id === counselorId);
    if (alreadyAssigned) {
      throw new Error("Counselor is already assigned to this section");
    }

    await prisma.section.update({
      where: { id: sectionId },
      data: {
        counselors: {
          connect: { id: counselorId },
        },
      },
    });

    return await getSectionById(sectionId);
  } catch (error) {
    console.error("Error assigning counselor to section:", error);
    throw error;
  }
};

/**
 * Remove counselor from section (admin action)
 */
const removeCounselorFromSection = async (sectionId, counselorId) => {
  try {
    await prisma.section.update({
      where: { id: sectionId },
      data: {
        counselors: {
          disconnect: { id: counselorId },
        },
      },
    });

    return await getSectionById(sectionId);
  } catch (error) {
    console.error("Error removing counselor from section:", error);
    throw error;
  }
};

module.exports = {
  generateSectionCode,
  getAllSections,
  getSectionById,
  getSectionByCode,
  createSection,
  updateSection,
  deleteSection,
  regenerateSectionCode,
  assignTeacherToSection,
  removeTeacherFromSection,
  joinSectionWithCode,
  teacherJoinSectionWithCode,
  counselorJoinSectionWithCode,
  leaveSection,
  getAvailableTeachers,
  getAllCounselors,
  assignCounselorToSection,
  removeCounselorFromSection,
};
