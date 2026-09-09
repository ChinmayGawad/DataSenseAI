import { useState, useRef, useCallback } from 'react';
import { uploadDataset, DatasetUploadResponse } from '../lib/api';

export function useUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDataset, setUploadedDataset] = useState<DatasetUploadResponse | null>(null);
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFiles = useCallback(async (files: File | File[]) => {
    setErrorMsg(null);
    const filesArray = Array.isArray(files) ? files : [files];
    if (filesArray.length === 0) return null;

    setLocalFiles(filesArray);
    setIsUploading(true);
    try {
      const res = await uploadDataset(filesArray);
      setUploadedDataset(res);
      return res;
    } catch (err: any) {
      const msg = err.message || 'Failed to upload document(s)';
      setErrorMsg(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    return processFiles([file]);
  }, [processFiles]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setErrorMsg(null);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileList = Array.from(e.dataTransfer.files);
        await processFiles(fileList);
      }
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setErrorMsg(null);
      if (e.target.files && e.target.files.length > 0) {
        const fileList = Array.from(e.target.files);
        await processFiles(fileList);
      }
    },
    [processFiles]
  );

  const selectSample = useCallback(
    async (sampleType: 'retail' | 'marketing' | 'healthcare') => {
      setErrorMsg(null);
      setIsUploading(true);
      try {
        let csvContent = '';
        let fileName = '';

        if (sampleType === 'retail') {
          fileName = 'retail_sales_benchmark.csv';
          csvContent = `Order_ID,Order_Date,Region,Product_Category,Sales,Profit,Discount,Quantity\nORD-1001,2024-01-15,North,Electronics,1200.50,340.20,0.05,4\nORD-1002,2024-01-16,South,Furniture,850.00,120.00,0.10,2\nORD-1003,2024-01-17,East,Office Supplies,45.20,15.10,0.00,5\nORD-1004,2024-01-18,West,Electronics,2400.00,720.00,0.15,3\nORD-1005,2024-01-19,North,Furniture,650.00,80.00,0.20,1\nORD-1006,2024-01-20,East,Electronics,1800.00,510.00,0.05,2\nORD-1007,2024-01-21,West,Office Supplies,120.00,45.00,0.00,10\nORD-1008,2024-01-22,South,Electronics,3100.00,950.00,0.10,5\nORD-1009,2024-01-23,North,Office Supplies,85.00,28.00,0.00,4\nORD-1010,2024-01-24,East,Furniture,1450.00,210.00,0.15,3\nORD-1011,2024-01-25,West,Electronics,950.00,280.00,0.05,2\nORD-1012,2024-01-26,South,Office Supplies,210.00,65.00,0.00,8\nORD-1013,2024-01-27,North,Furniture,780.00,95.00,0.10,2\nORD-1014,2024-01-28,East,Electronics,4200.00,1350.00,0.20,6\nORD-1015,2024-01-29,West,Furniture,1100.00,160.00,0.15,4\nORD-1016,2024-01-30,South,Electronics,1600.00,480.00,0.05,3\nORD-1017,2024-01-31,North,Electronics,2900.00,890.00,0.10,5\nORD-1018,2024-02-01,East,Office Supplies,65.00,22.00,0.00,3\nORD-1019,2024-02-02,West,Furniture,1350.00,190.00,0.10,3\nORD-1020,2024-02-03,South,Electronics,2200.00,660.00,0.05,4\nORD-1021,2024-02-04,North,Electronics,15000.00,4200.00,0.05,12\nORD-1022,2024-02-05,East,Furniture,,110.00,0.10,2\nORD-1023,2024-02-06,West,Office Supplies,95.00,,0.00,6\nORD-1024,2024-02-07,South,Furniture,920.00,130.00,0.15,3`;
        } else if (sampleType === 'marketing') {
          fileName = 'marketing_campaign_benchmark.csv';
          csvContent = `Campaign_ID,Launch_Date,Channel,Ad_Spend,Impressions,Clicks,Conversions,Revenue\nCMP-01,2024-03-01,Google Search,5000,120000,4500,220,18500\nCMP-02,2024-03-02,Facebook Ads,3500,95000,3100,140,9800\nCMP-03,2024-03-03,Email Newsletter,800,25000,1800,160,11200\nCMP-04,2024-03-04,LinkedIn Ads,4200,60000,1900,95,14200\nCMP-05,2024-03-05,YouTube Video,6500,210000,5200,180,16500\nCMP-06,2024-03-06,TikTok Ads,2800,180000,6100,130,7900\nCMP-07,2024-03-07,Google Search,5500,135000,4900,245,21000\nCMP-08,2024-03-08,Facebook Ads,3200,88000,2900,125,8400\nCMP-09,2024-03-09,Influencer,4000,150000,3800,110,9500\nCMP-10,2024-03-10,Email Newsletter,750,24000,1750,155,10800`;
        } else {
          fileName = 'healthcare_outcomes_benchmark.csv';
          csvContent = `Patient_ID,Age,Gender,Systolic_BP,Diastolic_BP,Cholesterol,BMI,Glucose,Outcome\nPT-001,45,M,120,80,195,24.5,92,0\nPT-002,54,F,135,88,230,28.1,105,1\nPT-003,39,M,118,78,180,22.4,88,0\nPT-004,62,F,148,92,260,31.2,145,1\nPT-005,58,M,140,90,245,29.8,128,1\nPT-006,29,F,110,72,165,21.0,85,0\nPT-007,71,M,155,95,280,33.5,160,1\nPT-008,48,F,125,82,210,25.6,98,0\nPT-009,52,M,130,85,225,27.3,112,0\nPT-010,36,F,115,75,175,23.1,90,0`;
        }

        const file = new File([csvContent], fileName, { type: 'text/csv' });
        return await processFiles([file]);
      } catch (err: any) {
        console.error('Failed to load sample benchmark:', err);
        throw err;
      }
    },
    [processFiles]
  );

  const resetUpload = useCallback(() => {
    setUploadedDataset(null);
    setLocalFiles([]);
    setErrorMsg(null);
    setIsDragging(false);
    setIsUploading(false);
  }, []);

  return {
    isDragging,
    isUploading,
    uploadedDataset,
    localFile: localFiles[0] || null,
    localFiles,
    errorMsg,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileInput,
    processFile,
    processFiles,
    selectSample,
    resetUpload,
  };
}
