import{j as n,m as p}from"./ui-D_LkVF2r.js";const u=({children:e,variant:r="default",padding:o="md",className:s="",onClick:a})=>{const t={none:"",sm:"p-3",md:"p-4",lg:"p-6"},l=`
    bg-gray-800/50 backdrop-blur-sm
    rounded-xl border border-gray-700
  `,d={default:"",hover:"transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10",interactive:"cursor-pointer transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02]"};return r==="interactive"&&a?n.jsx(p.div,{whileHover:{scale:1.02},whileTap:{scale:.98},onClick:a,className:`${l} ${d[r]} ${t[o]} ${s}`,children:e}):n.jsx("div",{className:`${l} ${d[r]} ${t[o]} ${s}`,children:e})};export{u as C};
