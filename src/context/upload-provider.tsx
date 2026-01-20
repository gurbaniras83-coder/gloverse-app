"use client";
import React, { createContext, useContext, useState } from 'react';

const UploadContext = createContext<any>(null);

export const UploadProvider = ({ children }: { children: React.ReactNode }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const value = { isUploading, setIsUploading, progress, setProgress };

  return (
    <UploadContext.Provider value={value}>
      {/* ਇੱਥੇ key ਲਗਾਉਣ ਨਾਲ ਲਾਲ ਡੱਬਾ ਹਮੇਸ਼ਾ ਲਈ ਹਟ ਜਾਵੇਗਾ */}
      <div key="global-upload-wrapper" style={{ display: 'contents' }}>
        {children}
      </div>
    </UploadContext.Provider>
  );
};

export const useUpload = () => useContext(UploadContext);
