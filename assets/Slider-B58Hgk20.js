import{j as e}from"./ui-D_LkVF2r.js";const u=({value:t,onChange:d,min:a=0,max:s=100,step:p=1,label:n,showValue:i=!0,formatValue:c=r=>String(r),disabled:o=!1,className:l=""})=>{const r=(t-a)/(s-a)*100;return e.jsxs("div",{className:`w-full ${l}`,children:[(n||i)&&e.jsxs("div",{className:"flex justify-between mb-2",children:[n&&e.jsx("label",{className:"text-sm font-medium text-gray-400",children:n}),i&&e.jsx("span",{className:"text-sm font-medium text-white",children:c(t)})]}),e.jsx("div",{className:"relative",children:e.jsx("input",{type:"range",value:t,onChange:x=>d(Number(x.target.value)),min:a,max:s,step:p,disabled:o,className:`
            w-full h-2 rounded-full appearance-none cursor-pointer
            bg-gray-700
            ${o?"opacity-50 cursor-not-allowed":""}
          `,style:{background:`linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${r}%, #374151 ${r}%, #374151 100%)`}})}),e.jsx("style",{children:`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.15s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
      `})]})};export{u as S};
