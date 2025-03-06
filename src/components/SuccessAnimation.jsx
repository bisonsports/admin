import React from 'react';

export default function SuccessAnimation({ isVisible, onAnimationComplete }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center">
        <div className="relative w-16 h-16">
          {/* Animated circle */}
          <svg className="absolute inset-0 w-full h-full">
            <circle
              className="stroke-green-500"
              strokeWidth="4"
              fill="none"
              r="30"
              cx="32"
              cy="32"
              style={{
                strokeDasharray: 188.5,
                strokeDashoffset: 188.5,
                animation: 'drawCircle 1s ease-in-out forwards'
              }}
            />
          </svg>
          {/* Tick mark */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{
              animation: 'drawTick 0.5s ease-in-out 0.5s forwards',
              opacity: 0
            }}
          >
            <path
              className="stroke-green-500"
              strokeWidth="4"
              fill="none"
              d="M20 32 L28 40 L44 24"
              style={{
                strokeDasharray: 50,
                strokeDashoffset: 50
              }}
            />
          </svg>
        </div>
        <p className="mt-4 text-xl font-semibold text-green-600">Booked !!!</p>
      </div>

      <style jsx>{`
        @keyframes drawCircle {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes drawTick {
          to {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
} 