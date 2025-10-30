'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs-backend-webgl';
import * as fp from 'fingerpose';
import { uploadAvatar } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Camera, RefreshCw, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

interface WebcamCaptureProps {
  onCapture: (url: string) => void;
}

// Define pose gestures for sequential detection
const poseOneGesture = new fp.GestureDescription('pose_1');
poseOneGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
poseOneGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
poseOneGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpLeft, 0.7);
poseOneGesture.addDirection(fp.Finger.Index, fp.FingerDirection.DiagonalUpRight, 0.7);
for (const finger of [fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
  poseOneGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  poseOneGesture.addCurl(finger, fp.FingerCurl.HalfCurl, 0.7);
}
poseOneGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
poseOneGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);

const poseTwoGesture = new fp.GestureDescription('pose_2');
for (const finger of [fp.Finger.Index, fp.Finger.Middle]) {
  poseTwoGesture.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
  poseTwoGesture.addDirection(finger, fp.FingerDirection.VerticalUp, 1.0);
  poseTwoGesture.addDirection(finger, fp.FingerDirection.DiagonalUpLeft, 0.7);
  poseTwoGesture.addDirection(finger, fp.FingerDirection.DiagonalUpRight, 0.7);
}
for (const finger of [fp.Finger.Ring, fp.Finger.Pinky]) {
  poseTwoGesture.addCurl(finger, fp.FingerCurl.FullCurl, 1.0);
  poseTwoGesture.addCurl(finger, fp.FingerCurl.HalfCurl, 0.7);
}
poseTwoGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
poseTwoGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);

const poseThreeGesture = new fp.GestureDescription('pose_3');
for (const finger of [fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring]) {
  poseThreeGesture.addCurl(finger, fp.FingerCurl.NoCurl, 1.0);
  poseThreeGesture.addDirection(finger, fp.FingerDirection.VerticalUp, 1.0);
  poseThreeGesture.addDirection(finger, fp.FingerDirection.DiagonalUpLeft, 0.7);
  poseThreeGesture.addDirection(finger, fp.FingerDirection.DiagonalUpRight, 0.7);
}
poseThreeGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
poseThreeGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 0.7);
poseThreeGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
poseThreeGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 0.5);

const poseSequence = [
  { id: 'pose_1', label: 'Pose 1', gesture: poseOneGesture },
  { id: 'pose_2', label: 'Pose 2', gesture: poseTwoGesture },
  { id: 'pose_3', label: 'Pose 3', gesture: poseThreeGesture },
];

const posePrompts = [
  'Show Pose 1 (raise one finger).',
  'Great! Now show Pose 2 (two fingers).',
  'Almost there! Show Pose 3 (three fingers).',
];

export function WebcamCapture({ onCapture }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState('Loading models...');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [handBox, setHandBox] = useState<{top: number; left: number; width: number; height: number} | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseFeedback, setPoseFeedback] = useState<'match' | 'wrong' | null>(null);
  const [completedPoses, setCompletedPoses] = useState<number[]>([]);
  const { toast } = useToast();
  const gestureEstimatorRef = useRef<fp.GestureEstimator | null>(null);
  const poseHoldRef = useRef(0);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (!gestureEstimatorRef.current) {
    gestureEstimatorRef.current = new fp.GestureEstimator(poseSequence.map((pose) => pose.gesture));
  }

  const setStatusMessage = useCallback(
    (message: string) => {
      setStatus((prev) => (prev === message ? prev : message));
    },
    [setStatus]
  );

  const loadHandposeModel = useCallback(async () => {
    try {
      await tf.setBackend('webgl');
      const loadedModel = await handpose.load();
      setModel(loadedModel);
      setStatusMessage('Ready to start. Click "Start Gesture Capture".');
    } catch (error) {
      console.error('Failed to load handpose model', error);
      setStatusMessage('Error Loading.... Please refresh.');
    }
  }, [setStatusMessage]);

  useEffect(() => {
    loadHandposeModel();
  }, [loadHandposeModel]);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      setPoseFeedback(null);
      setHandBox(null);
      setStatusMessage('Photo captured! Review below.');
    }
  }, [setStatusMessage, webcamRef]);

  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    const INITIAL_COUNT = 3;
    let remaining = INITIAL_COUNT;

    setIsDetecting(false);
    setCountdown(INITIAL_COUNT);
    setStatusMessage('Capturing photo...');

    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      const nextValue = Math.max(remaining, 0);
      setCountdown(nextValue);

      if (nextValue <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdown(null);
        capture();
      }
    }, 1000);
  }, [capture, setStatusMessage]);

  const detect = useCallback(
    async (net: handpose.HandPose) => {
      if (
        webcamRef.current &&
        typeof webcamRef.current.getScreenshot === 'function' &&
        webcamRef.current.video?.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const hands = await net.estimateHands(video);

        if (hands.length > 0) {
          const hand = hands[0];

          if (hand.boundingBox) {
            const [x1, y1] = hand.boundingBox.topLeft as [number, number];
            const [x2, y2] = hand.boundingBox.bottomRight as [number, number];
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            const displayedWidth = video.clientWidth;
            const displayedHeight = video.clientHeight;
            const scaleX = displayedWidth / videoWidth;
            const scaleY = displayedHeight / videoHeight;
            setHandBox({
              left: x1 * scaleX,
              top: y1 * scaleY,
              width: (x2 - x1) * scaleX,
              height: (y2 - y1) * scaleY,
            });
          }

          const estimator = gestureEstimatorRef.current;
          if (estimator) {
            const landmarks3D = hand.landmarks as unknown as {x: number; y: number; z: number}[];
            const estimation = await estimator.estimate(landmarks3D, 8);

            if (estimation.gestures && estimation.gestures.length > 0) {
              const topGesture = estimation.gestures.reduce((prev, current) =>
                prev.score > current.score ? prev : current
              );
              const matchedIndex = poseSequence.findIndex((pose) => pose.id === topGesture.name);
              const aboveThreshold = topGesture.score > 0.9;

              if (matchedIndex >= 0 && aboveThreshold) {
                if (matchedIndex === currentPoseIndex) {
                  setPoseFeedback((prev) => (prev === 'match' ? prev : 'match'));
                  poseHoldRef.current += 1;

                  const HOLD_FRAMES = 5;
                  if (poseHoldRef.current >= HOLD_FRAMES) {
                    poseHoldRef.current = 0;
                    setCompletedPoses((prev) =>
                      prev.includes(currentPoseIndex) ? prev : [...prev, currentPoseIndex]
                    );

                    if (currentPoseIndex === poseSequence.length - 1) {
                      startCountdown();
                    } else {
                      const nextIndex = currentPoseIndex + 1;
                      setCurrentPoseIndex(nextIndex);
                      setPoseFeedback(null);
                      setStatusMessage(posePrompts[nextIndex]);
                    }
                  }
                } else {
                  poseHoldRef.current = 0;
                  setPoseFeedback((prev) => (prev === 'wrong' ? prev : 'wrong'));
                }
              } else {
                poseHoldRef.current = 0;
                setPoseFeedback((prev) => (prev === 'wrong' ? prev : 'wrong'));
              }
            } else {
              poseHoldRef.current = 0;
              setPoseFeedback((prev) => (prev === 'wrong' ? prev : 'wrong'));
            }
          }
        } else {
          poseHoldRef.current = 0;
          setPoseFeedback(null);
          setHandBox(null);
        }
      }
    },
    [currentPoseIndex, setStatusMessage, startCountdown, webcamRef]
  );

  useEffect(() => {
    if (!isDetecting) {
      poseHoldRef.current = 0;
    }

    if (model && isDetecting) {
      const detectionInterval = setInterval(() => {
        detect(model);
      }, 200);
      return () => clearInterval(detectionInterval);
    }

    return undefined;
  }, [model, isDetecting, detect]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);


  const handleUpload = async () => {
    if (!imgSrc) return;
    setIsUploading(true);
    setStatusMessage('Uploading...');
    try {
      const response = await fetch(imgSrc);
      if (!response.ok) {
        throw new Error('Failed to read captured photo. Please retake and try again.');
      }
      const blob = await response.blob();
      const fileName = `pose-capture-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadAvatar(formData);

      if (result.error || !result.data?.publicUrl) {
        throw new Error(result.error?.message || 'Upload failed.');
      }
      onCapture(result.data.publicUrl);
      setStatusMessage('Upload complete!');
      toast({ title: 'Success', description: 'Your photo has been uploaded.' });
    } catch (error: any) {
      setStatusMessage('Upload failed. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    poseHoldRef.current = 0;
    setImgSrc(null);
    setIsDetecting(false);
    setCountdown(null);
    setHandBox(null);
    setPoseFeedback(null);
    setCompletedPoses([]);
    setCurrentPoseIndex(0);
    setStatusMessage('Ready to start. Click "Start Gesture Capture".');
  };
  
  if (!model) {
    return (
      <div className="w-full aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-muted-foreground" />
        <p className="font-medium">Loading...</p>
        <p className="text-sm text-muted-foreground">Please wait a moment...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden relative flex items-center justify-center">
        {imgSrc ? (
          <img src={imgSrc} alt="capture" className="h-full w-full object-cover" />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="h-full w-full object-cover"
            mirrored
          />
        )}
        {!imgSrc && handBox && poseFeedback !== null && (
          <div
            className={`pointer-events-none absolute rounded-[28px] border-[6px] ${
              poseFeedback === 'match' ? 'border-[#2ECC71]' : 'border-[#E74C3C]'
            } transition-all duration-150`}
            style={{
              top: handBox.top,
              left: handBox.left,
              width: handBox.width,
              height: handBox.height,
            }}
          >
            <span
              className={`absolute -top-9 left-0 rounded-tl-[18px] rounded-tr-[18px] rounded-br-lg px-4 py-1.5 text-xs font-semibold tracking-wide text-white shadow-sm ${
                poseFeedback === 'match' ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'
              }`}
            >
              {poseFeedback === 'match'
                ? poseSequence[Math.min(currentPoseIndex, poseSequence.length - 1)].label
                : 'Undetected'}
            </span>
          </div>
        )}
        {countdown !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white">Capturing photo in</p>
            <p className="text-white text-7xl font-bold">{countdown}</p>
          </div>
        )}
      </div>
      <div className="min-h-[24px] text-center text-sm text-muted-foreground">{status}</div>
      {imgSrc ? (
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} className="w-full" disabled={isUploading}>
            <RefreshCw /> Retake
          </Button>
          <Button onClick={handleUpload} className="w-full" disabled={isUploading}>
            {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            Submit
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            poseHoldRef.current = 0;
            setHandBox(null);
            setPoseFeedback(null);
            setCompletedPoses([]);
            setCurrentPoseIndex(0);
            setCountdown(null);
            setIsDetecting(true);
            setStatusMessage(posePrompts[0]);
          }}
          disabled={isDetecting || countdown !== null}
          className="w-full"
        >
          <Camera />
          {isDetecting ? 'Detecting Gesture...' : 'Start Gesture Capture'}
        </Button>
      )}
    </div>
  );
}