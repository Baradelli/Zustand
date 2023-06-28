import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../lib/axios";

interface Course {
  id: number;
  modules: Array<{
    id: number;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      duration: string;
    }>;
  }>;
}

export interface PlayerState {
  course: Course | null;
  currentModuleIndex: number;
  currentLessonIndex: number;
  isLoading: boolean;

  play: (moduleAndLessonIndex: [number, number]) => void;
  next: () => void;
  load: () => Promise<void>;
}

export const useStore = create(
  persist<PlayerState>(
    (set, get) => {
      return {
        course: null,
        currentModuleIndex: 0,
        currentLessonIndex: 0,
        isLoading: true,

        load: async () => {
          set({ isLoading: true });

          const { data } = await api.get("/courses/1");

          set({ course: data, isLoading: false });
        },

        play: (moduleAndLessonIndex: [number, number]) => {
          const [moduleIndex, lessonIndex] = moduleAndLessonIndex;

          set({
            currentModuleIndex: moduleIndex,
            currentLessonIndex: lessonIndex,
          });
        },

        next: () => {
          const { currentModuleIndex, currentLessonIndex, course } = get();

          const nextLessonIndex = currentLessonIndex + 1;
          const nextLesson =
            course?.modules[currentModuleIndex].lessons[nextLessonIndex];

          if (nextLesson) {
            set({ currentLessonIndex: nextLessonIndex });
          } else {
            const nextModuleIndex = currentModuleIndex + 1;
            const nextModule = course?.modules[nextModuleIndex];

            if (nextModule) {
              set({
                currentModuleIndex: nextModuleIndex,
                currentLessonIndex: 0,
              });
            }
          }
        },
      };
    },
    {
      name: "help-desc",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useCurrentLesson = () => {
  return useStore((state) => {
    const { currentLessonIndex, currentModuleIndex } = state;

    const currentModule = state.course?.modules[currentModuleIndex];
    const currentLesson =
      state.course?.modules[currentModuleIndex].lessons[currentLessonIndex];

    return { currentModule, currentLesson };
  });
};
