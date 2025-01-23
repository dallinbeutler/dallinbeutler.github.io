export interface AprilTagDetection {
  id: number;
  hamming: number;
  decision_margin: number;
  center: { x: number; y: number };
  corners: Array<{ x: number; y: number }>;
  pose?: {
    R: number[][];
    t: number[];
    e: number;
    sol?: Array<{ R: number[][]; t: number[]; e: number }>;
  };
}

export interface AprilTagInstance {
  detect(grayscaleImg: Uint8Array, imgWidth: number, imgHeight: number): Promise<AprilTagDetection[]>;
  set_camera_info(fx: number, fy: number, cx: number, cy: number): void;
  set_tag_size(tagId: number, size: number): void;
  set_max_detections(maxDetections: number): void;
  set_return_pose(returnPose: 0 | 1): void;
  set_return_solutions(returnSolutions: 0 | 1): void;
}

export interface AprilTagConstructor {
  new (onDetectorReadyCallback: () => void): AprilTagInstance;
} 