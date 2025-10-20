# GPU 机器学习能力测试工具

## 简介

这个Python脚本可以帮助你检测显卡的机器学习能力，支持：

- ✅ **NVIDIA GPU** (CUDA 支持)
- ✅ **AMD GPU** (ROCm 支持)
- ✅ **Apple Silicon** (M1/M2/M3 芯片的 Metal 支持)
- ✅ **CPU 模式** (无GPU时的备选方案)

## 快速开始

### 1. 运行测试

```bash
# 直接运行（无需安装额外依赖）
python scripts/gpu_ml_test.py

# 或者添加执行权限后运行
chmod +x scripts/gpu_ml_test.py
./scripts/gpu_ml_test.py
```

### 2. 安装 PyTorch 测试完整功能（可选）

脚本会自动检测是否安装了 PyTorch，如果你想测试 GPU 计算能力，建议先安装：

**对于 NVIDIA GPU (CUDA):**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**对于 Apple Silicon (M1/M2/M3):**
```bash
pip install torch torchvision torchaudio
```

**对于 AMD GPU (ROCm):**
```bash
# 请参考 AMD ROCm 官方文档
```

**仅 CPU 模式:**
```bash
pip install torch torchvision torchaudio
```

## 测试内容

该脚本会检测以下内容：

### 1. 系统信息
- 操作系统版本
- CPU 架构
- Python 版本

### 2. NVIDIA CUDA
- PyTorch CUDA 支持
- CUDA 版本
- GPU 数量和型号
- 显存大小
- 执行简单的矩阵运算测试

### 3. AMD ROCm
- PyTorch ROCm 支持
- ROCm 版本
- GPU 信息

### 4. Apple Metal
- 检测是否为 Apple Silicon
- MPS (Metal Performance Shaders) 支持
- 执行 MPS 计算测试

### 5. TensorFlow GPU
- TensorFlow GPU 设备检测
- GPU 计算测试

### 6. 推荐安装
根据你的硬件配置，脚本会推荐适合的机器学习框架和安装命令

## 输出示例

```
╔════════════════════════════════════════════════════════════╗
║     GPU Machine Learning Capability Detection Tool        ║
║              显卡机器学习能力检测工具                        ║
╚════════════════════════════════════════════════════════════╝

============================================================
                    System Information
============================================================

ℹ OS: Darwin
ℹ OS Version: Darwin Kernel Version 23.0.0
ℹ Architecture: arm64
ℹ Python Version: 3.11.5
ℹ Processor: arm

============================================================
                  NVIDIA CUDA Detection
============================================================

⚠ PyTorch not installed
ℹ Install with: pip install torch torchvision torchaudio

============================================================
                   Apple Metal Detection
============================================================

✓ Running on Apple Silicon
✓ PyTorch installed
✓ Metal Performance Shaders (MPS) is available
✓ MPS computation test passed

...
```

## 常见问题

### Q1: 脚本显示 "PyTorch not installed"
**A:** 这是正常的，脚本可以在没有 PyTorch 的情况下运行基本检测。如果你想测试 GPU 计算能力，请按上面的说明安装 PyTorch。

### Q2: 我有 NVIDIA 显卡但检测不到 CUDA
**A:** 可能原因：
1. 没有安装 NVIDIA 驱动
2. 没有安装 CUDA Toolkit
3. PyTorch 安装的是 CPU 版本

解决方案：
```bash
# 1. 检查驱动
nvidia-smi

# 2. 安装支持 CUDA 的 PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Q3: Apple Silicon Mac 显示 MPS 不可用
**A:** 确保你的 PyTorch 版本支持 MPS (通常需要 PyTorch 1.12+)：
```bash
pip install --upgrade torch torchvision torchaudio
```

### Q4: 只想用 CPU 训练模型可以吗？
**A:** 当然可以！所有主流机器学习框架都支持 CPU 模式。GPU 主要是加速训练，对于小规模模型或推理任务，CPU 完全够用。

## 推荐的机器学习框架

### 深度学习
- **PyTorch**: 最流行的深度学习框架，社区活跃
- **TensorFlow**: Google 开发，适合生产部署
- **JAX**: Google 开发，函数式编程风格

### 传统机器学习
- **Scikit-learn**: 经典机器学习算法库
- **XGBoost**: 梯度提升树算法
- **LightGBM**: 微软开发的高效梯度提升框架

### 自然语言处理
- **Hugging Face Transformers**: 预训练模型库
- **spaCy**: 工业级 NLP 工具

### 计算机视觉
- **OpenCV**: 计算机视觉库
- **Pillow**: 图像处理

## 云 GPU 选项

如果本地没有 GPU，可以考虑：
- **Google Colab**: 免费提供 GPU (每天有使用限制)
- **Kaggle Notebooks**: 免费 GPU 环境
- **AWS SageMaker**: 专业 ML 平台
- **Azure ML**: 微软云 ML 服务
- **阿里云 PAI**: 国内云服务

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
