import{j as t,A as b,m as y}from"./ui-D_LkVF2r.js";import{r as o}from"./vendor-Vqvh67Lm.js";const w=({options:i,value:c,onChange:u,placeholder:m="선택하세요",label:d,disabled:a=!1,className:p=""})=>{const[r,n]=o.useState(!1),l=o.useRef(null),s=i.find(e=>e.value===c);o.useEffect(()=>{const e=f=>{l.current&&!l.current.contains(f.target)&&n(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[]);const x=e=>{u(e),n(!1)};return t.jsxs("div",{className:`relative ${p}`,ref:l,children:[d&&t.jsx("label",{className:"block text-sm font-medium text-gray-400 mb-1",children:d}),t.jsxs("button",{type:"button",onClick:()=>!a&&n(!r),disabled:a,className:`
          w-full flex items-center justify-between
          px-4 py-2.5 rounded-lg
          bg-gray-700 border border-gray-600
          text-left transition-all duration-200
          ${a?"opacity-50 cursor-not-allowed":"hover:border-purple-500 cursor-pointer"}
          ${r?"ring-2 ring-purple-500 border-purple-500":""}
        `,children:[t.jsx("span",{className:s?"text-white":"text-gray-400",children:s?t.jsxs("span",{className:"flex items-center gap-2",children:[s.icon,s.label]}):m}),t.jsx("svg",{className:`w-5 h-5 text-gray-400 transition-transform duration-200 ${r?"rotate-180":""}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 9l-7 7-7-7"})})]}),t.jsx(b,{children:r&&t.jsx(y.div,{initial:{opacity:0,y:-10},animate:{opacity:1,y:0},exit:{opacity:0,y:-10},transition:{duration:.15},className:"absolute z-50 w-full mt-2 py-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto",children:i.map(e=>t.jsxs("button",{onClick:()=>!e.disabled&&x(e.value),disabled:e.disabled,className:`
                  w-full px-4 py-2.5 text-left flex items-center gap-2
                  transition-colors duration-150
                  ${e.disabled?"opacity-50 cursor-not-allowed":"hover:bg-gray-700 cursor-pointer"}
                  ${e.value===c?"bg-purple-600/20 text-purple-400":"text-white"}
                `,children:[e.icon,e.label]},e.value))})})]})};export{w as D};
