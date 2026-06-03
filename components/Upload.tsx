import React, {useCallback, useEffect, useRef, useState} from "react";
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../lib/constants";

interface UploadProps {
    onComplete?: (base64Data: string) => void;
}

const Upload = ({onComplete}: UploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const base64DataRef = useRef<string | null>(null);

    const {isSignedIn} = useOutletContext<AuthContext>();

    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const processFile = useCallback((file: File) => {
        if (!isSignedIn) return;
        const MAX_BYTES = 10 * 1024 * 1024;
        if (file.size > MAX_BYTES) {
            //TODO surface an error to the user instead of proceeding
            return;
        }
        setFile(file);
        setProgress(0);

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result as string;
            base64DataRef.current = base64Data;

            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setProgress((prev) => Math.min(prev + PROGRESS_STEP, 100));
            }, PROGRESS_INTERVAL_MS);
        };
        reader.readAsDataURL(file);
    }, [isSignedIn]);

    useEffect(() => {
        if (progress === 100) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                if (base64DataRef.current) {
                    onCompleteRef.current?.(base64DataRef.current);
                }
            }, REDIRECT_DELAY_MS);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [progress === 100]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isSignedIn) return;

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith("image/")) {
            processFile(droppedFile);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type.startsWith("image/")) {
            processFile(selectedFile);
        }
    };

    return (
        <div className="upload">
            {!file ? (
                <div className={`dropzone ${isDragging ? 'is-dragging' : ''}`}>
                    <input
                        type="file" className="drop-input"
                        accept=".jpg,.jpeg,.png"
                        disabled={!isSignedIn}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onChange={handleChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20}/>
                        </div>
                        <p>
                            {isSignedIn ? (
                                "Click to upload or just drag and drop"
                            ) : (
                                "Sign in or sign up with Puter to upload files"
                            )}
                        </p>
                        <p className="help">
                            Maximum file size is 10MB.
                        </p>
                    </div>

                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className="image" />
                            )}
                        </div>

                        <h3>{file.name}</h3>

                        <div className="progress">
                            <div className="bar" style={{ width: `${progress}%` }}/>
                            <p className="status-text">
                                {progress < 100 ? "Analyzing Floor Plan..." : "Redirecting..."}
                            </p>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Upload;