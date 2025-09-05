import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOnboarding } from "../contexts/OnboardingContext";
import { ChevronLeftIcon, ChevronRightIcon } from "../assets/icons";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialStep {
  selector: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  path: string; // The path where the element exists
}

// All steps are on the home page ('/')
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    selector: "#onboarding-search",
    title: "البحث عن المنتجات",
    content: "استخدم شريط البحث للعثور بسرعة على أي منتج تريده في متجرنا.",
    position: "bottom",
    path: "/",
  },
  {
    selector: "#onboarding-filter",
    title: "تصفية النتائج",
    content:
      "يمكنك تصفية المنتجات حسب السعر أو التقييم للعثور على ما يناسبك تمامًا.",
    position: "bottom",
    path: "/",
  },
  {
    selector: '[id^="onboarding-add-to-cart-"]',
    title: "إضافة للسلة",
    content: "اضغط هنا لإضافة أي منتج يعجبك إلى عربة التسوق الخاصة بك.",
    position: "top",
    path: "/",
  },
  {
    selector: "#onboarding-nav",
    title: "التنقل في التطبيق",
    content:
      "استخدم شريط التنقل السفلي للوصول بسهولة إلى عربة التسوق، المفضلة، وحسابك.",
    position: "top",
    path: "/",
  },
  {
    selector: "#onboarding-profile",
    title: "إدارة حسابك",
    content:
      "من هنا يمكنك تعديل معلوماتك، عرض سجل طلباتك، وإعادة عرض هذا الدليل التعليمي.",
    position: "top",
    path: "/",
  },
];

const OnboardingGuide: React.FC = () => {
  const { finishGuide } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const step = TUTORIAL_STEPS[currentStep];

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishGuide();
    }
  }, [currentStep, finishGuide]);

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    setHighlightRect(null); // Clear previous highlight while searching

    // CRITICAL FIX: Check if the user is on the correct page for the current step.
    // If not, navigate them there first.
    if (step.path && location.pathname !== step.path) {
      navigate(step.path);
      // The effect will re-run automatically once the navigation is complete.
      return;
    }

    let elementPoll: number | undefined;
    const findAndHighlight = () => {
      const element = document.querySelector(step.selector);
      if (element) {
        clearInterval(elementPoll);

        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });

        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setHighlightRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        }, 400);
      }
    };

    elementPoll = window.setInterval(findAndHighlight, 100);

    const pollTimeout = setTimeout(() => {
      clearInterval(elementPoll);
      if (!document.querySelector(step.selector)) {
        console.warn(
          `Onboarding element not found: ${step.selector}, skipping.`
        );
        nextStep();
      }
    }, 3000);

    window.addEventListener("resize", findAndHighlight);

    return () => {
      clearInterval(elementPoll);
      clearTimeout(pollTimeout);
      window.removeEventListener("resize", findAndHighlight);
    };
  }, [
    currentStep,
    step.selector,
    step.path,
    nextStep,
    navigate,
    location.pathname,
  ]);

  const getTooltipPosition = () => {
    if (!highlightRect || !tooltipRef.current) return {};

    const tooltipHeight = tooltipRef.current.offsetHeight;
    const tooltipWidth = tooltipRef.current.offsetWidth;
    const margin = 16;
    let pos = { top: 0, left: 0 };

    switch (step.position) {
      case "top":
        pos = {
          top: highlightRect.top - tooltipHeight - margin,
          left: highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2,
        };
        break;
      case "bottom":
        pos = {
          top: highlightRect.top + highlightRect.height + margin,
          left: highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2,
        };
        break;
      // ... other positions if needed
    }

    // Constrain to viewport
    if (pos.left < margin) pos.left = margin;
    if (pos.left + tooltipWidth > window.innerWidth - margin)
      pos.left = window.innerWidth - tooltipWidth - margin;
    if (pos.top < margin) pos.top = margin;
    if (pos.top + tooltipHeight > window.innerHeight - margin)
      pos.top = window.innerHeight - tooltipHeight - margin;

    return pos;
  };

  const tooltipStyle = {
    ...getTooltipPosition(),
  };

  return (
    <div className="fixed inset-0 z-[999] animate-fade-in">
      <div
        className="fixed inset-0 bg-black/70"
        style={{
          clipPath: highlightRect
            ? `path(evenodd, 'M 0 0 H ${window.innerWidth} V ${
                window.innerHeight
              } H 0 Z M ${highlightRect.left - 8} ${highlightRect.top - 8} H ${
                highlightRect.left + highlightRect.width + 8
              } V ${highlightRect.top + highlightRect.height + 8} H ${
                highlightRect.left - 8
              } Z')`
            : 'path("M 0 0 H 100% V 100% H 0 Z")', // Full mask when no element is highlighted
          transition: "clip-path 0.4s ease-in-out",
        }}
        onClick={finishGuide}
      ></div>

      {highlightRect && (
        <>
          <div
            className="fixed pointer-events-none rounded-lg border-2 border-dashed border-white transition-all duration-300"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
            }}
          ></div>
          <div
            ref={tooltipRef}
            style={tooltipStyle}
            className="fixed w-72 bg-white dark:bg-slate-800 p-5 rounded-lg shadow-2xl transition-all duration-300 animate-fade-in"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {step.content}
            </p>
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={finishGuide}
                className="text-sm text-slate-500 hover:underline"
              >
                تخطي الدليل
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold">
                  {currentStep + 1} / {TUTORIAL_STEPS.length}
                </span>
                <button
                  onClick={nextStep}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OnboardingGuide;
