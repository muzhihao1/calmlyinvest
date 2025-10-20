#!/usr/bin/env python3
"""
GPU Machine Learning Capability Test
测试显卡机器学习能力的脚本

This script detects and tests GPU capabilities for machine learning:
- NVIDIA GPUs (CUDA support)
- AMD GPUs (ROCm support)
- Apple Silicon (Metal Performance Shaders)
- CPU fallback information

Usage:
    python gpu_ml_test.py
"""

import sys
import platform
import subprocess
from typing import Dict, List, Optional, Tuple

# ANSI color codes for pretty output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(text: str) -> None:
    """Print a formatted header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'=' * 60}{Colors.ENDC}\n")


def print_success(text: str) -> None:
    """Print success message"""
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")


def print_info(text: str) -> None:
    """Print info message"""
    print(f"{Colors.OKBLUE}ℹ {text}{Colors.ENDC}")


def print_warning(text: str) -> None:
    """Print warning message"""
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")


def print_error(text: str) -> None:
    """Print error message"""
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")


def check_system_info() -> Dict[str, str]:
    """Get basic system information"""
    print_header("System Information")

    system_info = {
        "OS": platform.system(),
        "OS Version": platform.version(),
        "Architecture": platform.machine(),
        "Python Version": sys.version.split()[0],
        "Processor": platform.processor() or "Unknown"
    }

    for key, value in system_info.items():
        print_info(f"{key}: {value}")

    return system_info


def check_nvidia_cuda() -> Tuple[bool, Optional[Dict]]:
    """
    Check for NVIDIA GPU and CUDA support
    Returns: (has_nvidia, cuda_info)
    """
    print_header("NVIDIA CUDA Detection")

    cuda_info = {}

    # Try to import PyTorch
    try:
        import torch
        print_success("PyTorch installed")
        cuda_info["pytorch_version"] = torch.__version__

        if torch.cuda.is_available():
            print_success("CUDA is available in PyTorch")
            cuda_info["cuda_available"] = True
            cuda_info["cuda_version"] = torch.version.cuda
            cuda_info["cudnn_version"] = torch.backends.cudnn.version()
            cuda_info["gpu_count"] = torch.cuda.device_count()

            print_info(f"CUDA Version: {cuda_info['cuda_version']}")
            print_info(f"cuDNN Version: {cuda_info['cudnn_version']}")
            print_info(f"Number of GPUs: {cuda_info['gpu_count']}")

            # Get GPU details
            cuda_info["gpus"] = []
            for i in range(cuda_info["gpu_count"]):
                gpu_name = torch.cuda.get_device_name(i)
                gpu_memory = torch.cuda.get_device_properties(i).total_memory / 1024**3
                cuda_info["gpus"].append({
                    "id": i,
                    "name": gpu_name,
                    "memory_gb": round(gpu_memory, 2)
                })
                print_success(f"GPU {i}: {gpu_name} ({gpu_memory:.2f} GB)")

            # Perform a simple CUDA operation test
            try:
                x = torch.rand(1000, 1000).cuda()
                y = torch.rand(1000, 1000).cuda()
                z = torch.matmul(x, y)
                torch.cuda.synchronize()
                print_success("CUDA computation test passed")
                cuda_info["cuda_test_passed"] = True
            except Exception as e:
                print_error(f"CUDA computation test failed: {e}")
                cuda_info["cuda_test_passed"] = False

            return True, cuda_info
        else:
            print_warning("PyTorch installed but CUDA not available")
            cuda_info["cuda_available"] = False

    except ImportError:
        print_warning("PyTorch not installed")
        print_info("Install with: pip install torch torchvision torchaudio")

    # Try nvidia-smi command
    try:
        result = subprocess.run(['nvidia-smi'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print_success("nvidia-smi command available")
            print_info("\nNVIDIA-SMI Output:")
            print(result.stdout)
            return True, cuda_info
        else:
            print_warning("nvidia-smi command failed")
    except FileNotFoundError:
        print_warning("nvidia-smi not found - NVIDIA drivers may not be installed")
    except Exception as e:
        print_error(f"Error running nvidia-smi: {e}")

    return False, None


def check_amd_rocm() -> Tuple[bool, Optional[Dict]]:
    """
    Check for AMD GPU and ROCm support
    Returns: (has_amd, rocm_info)
    """
    print_header("AMD ROCm Detection")

    rocm_info = {}

    # Try to import PyTorch with ROCm
    try:
        import torch
        if torch.cuda.is_available() and "rocm" in torch.version.hip:
            print_success("ROCm is available in PyTorch")
            rocm_info["rocm_version"] = torch.version.hip
            rocm_info["gpu_count"] = torch.cuda.device_count()

            print_info(f"ROCm Version: {rocm_info['rocm_version']}")
            print_info(f"Number of GPUs: {rocm_info['gpu_count']}")

            # Get GPU details
            rocm_info["gpus"] = []
            for i in range(rocm_info["gpu_count"]):
                gpu_name = torch.cuda.get_device_name(i)
                rocm_info["gpus"].append({
                    "id": i,
                    "name": gpu_name
                })
                print_success(f"GPU {i}: {gpu_name}")

            return True, rocm_info
    except ImportError:
        print_warning("PyTorch with ROCm not installed")
    except Exception as e:
        print_warning(f"Error checking ROCm: {e}")

    # Try rocm-smi command
    try:
        result = subprocess.run(['rocm-smi'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print_success("rocm-smi command available")
            print_info("\nROCm-SMI Output:")
            print(result.stdout)
            return True, rocm_info
    except FileNotFoundError:
        print_warning("rocm-smi not found - ROCm may not be installed")
    except Exception as e:
        print_warning(f"Error running rocm-smi: {e}")

    return False, None


def check_apple_metal() -> Tuple[bool, Optional[Dict]]:
    """
    Check for Apple Silicon GPU (Metal Performance Shaders)
    Returns: (has_metal, metal_info)
    """
    print_header("Apple Metal Detection")

    if platform.system() != "Darwin":
        print_info("Not running on macOS - skipping Metal detection")
        return False, None

    metal_info = {}

    # Check if running on Apple Silicon
    is_apple_silicon = platform.machine() == "arm64"
    if is_apple_silicon:
        print_success("Running on Apple Silicon")
        metal_info["apple_silicon"] = True
    else:
        print_info("Running on Intel Mac")
        metal_info["apple_silicon"] = False

    # Try to import PyTorch and check MPS
    try:
        import torch
        print_success("PyTorch installed")
        metal_info["pytorch_version"] = torch.__version__

        if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            print_success("Metal Performance Shaders (MPS) is available")
            metal_info["mps_available"] = True

            # Try to perform a simple MPS operation
            try:
                x = torch.rand(1000, 1000).to('mps')
                y = torch.rand(1000, 1000).to('mps')
                z = torch.matmul(x, y)
                print_success("MPS computation test passed")
                metal_info["mps_test_passed"] = True
            except Exception as e:
                print_error(f"MPS computation test failed: {e}")
                metal_info["mps_test_passed"] = False

            return True, metal_info
        else:
            print_warning("MPS not available")
            if is_apple_silicon:
                print_info("You may need to update PyTorch to a version with MPS support")
                print_info("Install with: pip install torch torchvision torchaudio")
            metal_info["mps_available"] = False

    except ImportError:
        print_warning("PyTorch not installed")
        print_info("Install with: pip install torch torchvision torchaudio")

    return is_apple_silicon, metal_info


def check_tensorflow() -> Optional[Dict]:
    """Check TensorFlow GPU support"""
    print_header("TensorFlow GPU Detection")

    tf_info = {}

    try:
        import tensorflow as tf
        print_success(f"TensorFlow {tf.__version__} installed")
        tf_info["version"] = tf.__version__

        # Check for GPU devices
        gpus = tf.config.list_physical_devices('GPU')
        if gpus:
            print_success(f"Found {len(gpus)} GPU device(s)")
            tf_info["gpu_count"] = len(gpus)
            tf_info["gpus"] = []

            for i, gpu in enumerate(gpus):
                print_info(f"GPU {i}: {gpu.name}")
                tf_info["gpus"].append({"id": i, "name": gpu.name})

            # Test GPU computation
            try:
                with tf.device('/GPU:0'):
                    a = tf.constant([[1.0, 2.0], [3.0, 4.0]])
                    b = tf.constant([[1.0, 1.0], [0.0, 1.0]])
                    c = tf.matmul(a, b)
                print_success("TensorFlow GPU computation test passed")
                tf_info["gpu_test_passed"] = True
            except Exception as e:
                print_error(f"TensorFlow GPU computation test failed: {e}")
                tf_info["gpu_test_passed"] = False
        else:
            print_warning("No GPU devices found in TensorFlow")
            tf_info["gpu_count"] = 0

        return tf_info

    except ImportError:
        print_warning("TensorFlow not installed")
        print_info("Install with: pip install tensorflow")
        return None


def print_recommendations() -> None:
    """Print recommendations based on detected hardware"""
    print_header("Recommendations for Machine Learning")

    system = platform.system()

    print_info("Based on your system configuration:\n")

    # Check what was detected
    has_nvidia, _ = check_nvidia_cuda()
    has_amd, _ = check_amd_rocm()
    has_metal, _ = check_apple_metal()

    if has_nvidia:
        print_success("NVIDIA GPU detected - Best choice for ML/DL:")
        print("  • PyTorch with CUDA: pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118")
        print("  • TensorFlow with GPU: pip install tensorflow[and-cuda]")
        print("  • JAX with GPU: pip install jax[cuda]")
        print("  • Popular frameworks: Hugging Face Transformers, Lightning, etc.")

    elif has_metal:
        print_success("Apple Silicon detected - Recommended ML frameworks:")
        print("  • PyTorch with MPS: pip install torch torchvision torchaudio")
        print("  • TensorFlow for macOS: pip install tensorflow-macos tensorflow-metal")
        print("  • MLX (Apple's framework): pip install mlx")
        print("  • Core ML for production deployment")

    elif has_amd:
        print_success("AMD GPU detected - Recommended ML frameworks:")
        print("  • PyTorch with ROCm: Follow ROCm installation guide")
        print("  • TensorFlow with ROCm: Follow ROCm TensorFlow guide")

    else:
        print_warning("No GPU detected - CPU-only recommendations:")
        print("  • PyTorch (CPU): pip install torch torchvision torchaudio")
        print("  • TensorFlow (CPU): pip install tensorflow")
        print("  • Consider cloud GPU services: Google Colab, AWS, Azure, etc.")

    print("\n" + Colors.BOLD + "Popular ML Libraries (work on CPU and GPU):" + Colors.ENDC)
    print("  • Scikit-learn: pip install scikit-learn")
    print("  • XGBoost: pip install xgboost")
    print("  • LightGBM: pip install lightgbm")
    print("  • Hugging Face: pip install transformers datasets")


def main():
    """Main function to run all GPU detection tests"""
    print(f"\n{Colors.BOLD}{Colors.OKCYAN}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║     GPU Machine Learning Capability Detection Tool        ║")
    print("║              显卡机器学习能力检测工具                        ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(Colors.ENDC)

    # Gather all information
    system_info = check_system_info()

    # Check different GPU types
    has_nvidia, cuda_info = check_nvidia_cuda()
    has_amd, rocm_info = check_amd_rocm()
    has_metal, metal_info = check_apple_metal()

    # Check ML frameworks
    tf_info = check_tensorflow()

    # Print recommendations
    print_recommendations()

    # Summary
    print_header("Summary")

    if has_nvidia:
        print_success("✓ NVIDIA GPU with CUDA support detected")
    elif has_amd:
        print_success("✓ AMD GPU with ROCm support detected")
    elif has_metal:
        print_success("✓ Apple Silicon with Metal support detected")
    else:
        print_warning("No GPU acceleration detected - CPU mode only")

    print(f"\n{Colors.OKBLUE}For detailed installation guides, visit:{Colors.ENDC}")
    print("  • PyTorch: https://pytorch.org/get-started/locally/")
    print("  • TensorFlow: https://www.tensorflow.org/install")
    print("  • CUDA: https://developer.nvidia.com/cuda-downloads")
    print("  • ROCm: https://www.amd.com/en/graphics/servers-solutions-rocm")

    print(f"\n{Colors.BOLD}Test completed!{Colors.ENDC}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}Test interrupted by user{Colors.ENDC}")
        sys.exit(0)
    except Exception as e:
        print(f"\n{Colors.FAIL}Unexpected error: {e}{Colors.ENDC}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
