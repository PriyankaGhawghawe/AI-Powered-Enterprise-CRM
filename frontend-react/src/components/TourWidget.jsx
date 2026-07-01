import React, { useState, useEffect } from 'react';
import { FaCirclePlay, FaXmark } from 'react-icons/fa6';

const tourSteps = [
  { target: '.tour-step-role', text: 'Your active role determines your feature permissions and system capabilities.' },
  { target: '.tour-step-kpis', text: 'High-level executive metrics. The Database tab edits will instantly update the Cash Balance here.' },
  { target: '.tour-step-navigation', text: 'Use the navigation links to switch between Briefings, the Strategic War Room, Analytics, and Deal Records.' },
  { target: '.tour-step-pdf', text: 'Export a comprehensive PDF Executive Briefing of your company data instantly.' },
  { target: '.tour-step-chat', text: 'Chat with the Executive AI team. Test prompt templates or ask for summaries.' }
];

const TourWidget = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const getTooltipStyle = () => {
    if (!targetRect) return {};
    
    const tooltipWidth = 288; // w-72 is 18rem = 288px
    const tooltipHeight = 160; // approximate height
    
    // Check if target is on the far left (e.g. sidebar)
    if (targetRect.left + targetRect.width <= 320) {
      return {
        left: targetRect.left + targetRect.width + 20,
        top: Math.max(20, Math.min(window.innerHeight - tooltipHeight - 20, targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2)))
      };
    }
    
    // Check if target is on the far right (e.g. chat widget)
    if (targetRect.left >= window.innerWidth - 320) {
      return {
        left: targetRect.left - tooltipWidth - 20,
        top: Math.max(20, Math.min(window.innerHeight - tooltipHeight - 20, targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2)))
      };
    }
    
    // Default: Top or Bottom placement
    const fitsBelow = targetRect.top + targetRect.height + 20 + tooltipHeight < window.innerHeight;
    return {
      left: Math.max(20, Math.min(window.innerWidth - tooltipWidth - 20, targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2))),
      top: fitsBelow 
        ? targetRect.top + targetRect.height + 20 
        : targetRect.top - tooltipHeight - 20
    };
  };

  useEffect(() => {
    if (!isActive) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const step = tourSteps[currentStep];
      const el = document.querySelector(step.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top - 10,
          left: rect.left - 10,
          width: rect.width + 20,
          height: rect.height + 20
        });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      setIsActive(false);
      setCurrentStep(0);
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  return (
    <>
      {/* Start Button */}
      {!isActive && (
        <button 
          onClick={handleStart}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-transform hover:scale-105 border border-slate-700 font-semibold text-sm"
        >
          <FaCirclePlay className="text-emerald-400" /> Start Tour
        </button>
      )}

      {/* Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          {/* Dark backdrop with hole */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-all duration-500"
               style={targetRect ? {
                 clipPath: `polygon(
                   0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                   ${targetRect.left}px ${targetRect.top}px,
                   ${targetRect.left + targetRect.width}px ${targetRect.top}px,
                   ${targetRect.left + targetRect.width}px ${targetRect.top + targetRect.height}px,
                   ${targetRect.left}px ${targetRect.top + targetRect.height}px,
                   ${targetRect.left}px ${targetRect.top}px
                 )`
               } : {}}
          ></div>

          {/* Spotlight Highlight Ring */}
          {targetRect && (
            <div 
              className="absolute border-2 border-emerald-400 rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.5)] transition-all duration-500 pointer-events-none"
              style={{
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height
              }}
            ></div>
          )}

          {/* Tooltip Popup */}
          {targetRect && (
            <div 
              className="absolute bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-72 pointer-events-auto transition-all duration-500"
              style={getTooltipStyle()}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Step {currentStep + 1} of {tourSteps.length}</span>
                <button onClick={() => setIsActive(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <FaXmark />
                </button>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">{tourSteps[currentStep].text}</p>
              <div className="flex justify-end">
                <button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TourWidget;
