---
title: 强化学习入门文档
published: 2026-07-04
description: ''
image: ''
tags: [强化学习, 轮腿机器人, RoboMaster]
category: ''
draft: false 
lang: ''
---

## 前言

### 背景

本文档面向 **轮腿机器人** 的强化学习运动控制方案。

**目标场景**：轮腿机器人需要在复杂地形上实现稳定、灵活的运动，传统控制方法（PID、MPC 等）在面对非结构化环境和多自由度耦合时调参困难、适应性差。强化学习（RL）通过让机器人在仿真中反复试错，自动学习最优控制策略，非常适合这类任务。

### B站参考教程

[强化学习\+机器人运动控制入门 \(legged\_gym\+rsl\_rl 环境配置\)](https://www.bilibili.com/video/BV1bBCcBtEnw/?spm_id_from=333.1007.top_right_bar_window_default_collection.content.click&vd_source=4d62d1db2ffbd015fc2cf4d93ff88074)

[在Pytorch中使用Tensorboard可视化训练过程](https://www.bilibili.com/video/BV1Qf4y1C7kz/?spm_id_from=333.1007.top_right_bar_window_default_collection.content.click&vd_source=4d62d1db2ffbd015fc2cf4d93ff88074)

### 开源训练框架

[加速进化RL训练框架\(Isaac Gym\)](https://github.com/BoosterRobotics/booster_gym.git)

[宇树RL训练框架\(Isaac Gym\)](https://github.com/unitreerobotics/unitree_rl_gym.git)

> Isaac Gym 是 NVIDIA 推出的 GPU 加速物理仿真平台，基于 PhysX 引擎，支持在单张 GPU 上并行运行数千个仿真环境，大幅缩短强化学习训练时间，特别适合四足、人形及轮腿机器人等需要大量环境交互的运动控制任务。

[加速进化RL训练框架\(Isaac Lab\)](https://github.com/BoosterRobotics/booster_train.git)

[宇树RL训练框架\(Isaac Lab\)](https://github.com/unitreerobotics/unitree_rl_lab.git)

> Isaac Lab（原 Orbit）是 NVIDIA 基于 Isaac Sim 构建的模块化机器人学习框架，是 Isaac Gym 的继任者。它提供了标准化的仿真环境接口、传感器模拟、域随机化等功能，支持多种 RL 训练框架（RSL\-RL、SKRL 等），适合从仿真训练到真机部署的完整工作流。

注：Isaac Gym 已停止官方支持，且无法在 NVIDIA 50 系显卡上运行（PhysX GPU 加速不兼容 Blackwell 架构）。使用 50 系显卡只能使用 Isaac Lab（亲测）

这些框架开发时是为四足/人形机器人设计的，用于轮腿机器人需要做适配。四个框架都能改造使用：

- 加速进化 Isaac Gym（①）：代码源自 legged\_gym，PPO 训练流程与机器人构型解耦，不依赖具体机器人。改造思路是：新建环境类，替换 URDF，调整观测/动作维度和奖励函数即可，整体改动量可控。

- 宇树 RL Gym（②）：训练框架与 ① 同为 legged\_gym 派生，训练侧解耦程度相当，但部署层绑定了宇树 SDK \(unitree\_sdk2\_python\) ，sim2real比较困难，不够灵活。

- 加速进化 Isaac Lab（③）：基于 Isaac Lab 的 ManagerBasedRLEnv 架构 \+ RSL\-RL 算法，机器人配置、MDP 组件（观测/奖励/终止/事件/指令）完全模块化分离，支持 BeyondMimic 动捕模仿学习。替换为轮腿电机参数可行，需自定义 URDF、观测/动作空间和奖励函数。

- 宇树 RL Lab（④）：耦合度在四个框架中最高，改造似乎很难。

---

## 项目示例

这里给出一个真实项目的训练、改造过程，方便快速上手

::github{repo="juyanlanfeng/rc-train-ppo"}

这个框架仅仅作为示例使用，几乎没有实战经验，不适合改造使用，真正使用还是用成熟的开源框架

### 一句话理解

强化学习本质上是一个**自动试错的控制方案搜索器**。我们训练一个神经网络\(policy\)，神经网络可以理解为一个巨大的函数，函数的输入\(x\)是机器人身上的 IMU、关节状态等传感器信息，输出\(y\)直接是各个电机的扭矩/角度指令——这是一个端到端的方案，不需要运动学解算，也不需要理解网络内部为什么给出这样的结果。训练过程可以理解为：让机器人在物理仿真里反复尝试不同的动作，摔了或者动作不合规就扣分，走稳了并且动作符合要求就加分，通过海量试错不断调整网络参数，最终筛出一个"最不容易摔倒，且符合预期"的控制策略。一句话概括：**RL 不是教机器人理解走路，而是让它摔够足够多次之后，剩下的那个策略就是能走稳的。**

> 这里有一个认知问题：**不要把 RL 的"学习"和人的"理解"混为一谈。** 机器人从头到尾不知道什么叫"走路"，也不懂力学、平衡、动力学——它脑子里没有"步态"和"位姿"这些概念。它做的事情极其简单：随机尝试一个动作 → 环境给一个分数 → 分数高就朝这个方向多走一步，分数低就换个方向。循环几万次之后，统计上自然会筛出一组高分动作模式，这就是我们看到的"会走路了"。但本质上，这不是学会了走路，而是把"不摔倒"的概率优化到了足够高。所有的"智能"都是奖励函数驱动下的统计优化结果，不是机器人真的懂了什么。

### 四个核心概念（对照工程）

理解 RL 的第一步，是搞清楚四个名词分别对应代码里的什么东西：

|概念|是什么|项目内容对应|
|---|---|---|
|**Agent（智能体）**|机器人的”大脑”——一个神经网络，输入传感器数据，输出控制指令|`policy_net`、`actor`|
|**State（状态）**|机器人”现在什么样”——IMU、关节角度/角速度、机身姿态等|`obs`、`state`|
|**Environment（环境）**|“物理裁判”——负责算物理、给分数，上面提到的 Isaac Gym、Isaac Lab 都属于环境|`env`、`sim`|
|**Action（动作）**|“下一步关节怎么动”——各电机的目标扭矩/角度/速度|`action`、`target`|

这四个东西的关系就是一句话：**Agent 接收 State，给出 Action，Environment 执行 Action 后计算得分。**

### 一次训练循环在干什么

把这四个概念串起来，就是 RL 的核心循环。每一步只有四件事：

1. **读取机器人状态**：`obs = env.get_obs()` —— 从环境获取机器人当前状态

2. **用当前策略计算动作**：`action = policy(obs)` —— 策略网络接收状态，算出动作

3. **在物理仿真环境中执行动作**：`env.step(action)` —— 环境执行动作，推进物理仿真

4. **根据动作结果打分，给奖励**：`reward = calc_reward()` —— 环境根据新状态打分

这个循环需要跑成千上万次，而且可以**几千个机器人同时跑**（Isaac Gym 的 GPU 并行），大幅加速数据收集。每攒够一批数据，就用 PPO 算法更新一次策略网络参数，然后继续循环。整个过程就是在几十万次”试 → 记分 → 调整”的迭代中，让策略逐渐收敛到一个最优的控制方案。

### 什么是PPO

PPO（Proximal Policy Optimization，近端策略优化）是机器人 RL 领域最常用的算法。它的核心思想就一句话：**一次别学太多** 如果策略更新步子迈太大，可能上一轮机器人还能走，这一轮更新完直接全摔了——传统策略梯度方法没有约束，很容易训崩；PPO 的做法是给每次策略更新加上一些约束：通过剪切概率比（Clipping）限制新旧策略的差异，确保不会一次更新就跑偏太远。同时 PPO 天生适合 Isaac Gym 这类 GPU 并行仿真环境（几千个机器人同时跑），加上自适应 KL 惩罚、多轮小批量更新等机制，整体调参难度低、训练成功率高。总而言之，**PPO 存在的根本目的就是让 RL 能稳定地学下去**

### 项目结构说明

- 项目概述

    - 本仓库是一套基于 **Isaac Gym（PhysX）训练 \+ MuJoCo 评测** 的双足人形机器人（T4 / 内部型号 Z01，29 自由度）强化学习工具链。训练与评测刻意使用不同物理引擎，用于 sim2sim 迁移验证、防止"仿真作弊"。
    核心算法：**PPO（Proximal Policy Optimization）**，基于 [rsl\_rl](https://github.com/leggedrobotics/rsl_rl) 实现。

- 目录总览

    ```txt
    rc-train-ppo
    ├── Program/                          # 核心代码
    │   ├── rsl_rl/                       # PPO 算法库（第三方，BSD-3-Clause）
    │   ├── zoomlion_legged_gym/          # 训练框架（自研）
    │   └── sim2sim_mujoco/               # MuJoCo sim2sim 评测套件
    ├── resources/                        # 机器人资产（URDF + XML + 3D 网格）
    │   └── T4_std/T4_std/
    │       ├── urdf/t4_std.urdf          # URDF 描述文件
    │       ├── xml/t4_std.xml            # MuJoCo XML 模型文件
    │       └── meshes/                   # 35 个 .STL/.stl 网格文件（躯干、四肢、手）
    ├── march_policy/                     # t4_march 训练产物（这个不包含在训练框架里面，是训练后得到的结果，也就是训练好的policy）
    │   └── M2026022121_2026613085318/
    │       └── logs/t4_march_ppo/
    │           ├── exported_data/        # 11 个 checkpoint（2k~20k iter） + 配置记录
    │           └── 0_exported/policies/  # 导出的最终策略(迭代次数最多的一个policy) policy_1.pt
    ├── doc/                              # 文档与参考资料
    │   ├── CLAUDE.md                     # 项目运行环境说明（供 AI 辅助开发使用）
    │   ├── README_t4_march.md            # t4_march 任务设计文档
    │   ├── commands.md                   # 平台命令速查
    │   ├── 人形机器人使用说明书-v1.2.pdf
    │   ├── 步态生成与行走控制实践活页.pdf
    │   └── Rules(3).no_watermark.zh-CN.dual.pdf
    └── .git/                             # Git 版本控制
    ```

    - 也就是说，所有的算法都在Program文件夹中；resources文件夹中是机器人的定义文件，让训练框架以及仿真器知道机器人长什么样，哪些关节能动

- Program/rsl\_rl/ — PPO 算法库

    - 开源项目 [leggedrobotics/rsl\_rl](https://github.com/leggedrobotics/rsl_rl)，提供 PPO 强化学习算法的 PyTorch 实现。

    ```txt
    Program/rsl_rl/
    ├── setup.py                           # pip 安装入口（pip install -e . --no-deps）
    ├── LICENSE                            # BSD-3-Clause
    ├── README.md
    └── rsl_rl/
        ├── __init__.py
        ├── algorithms/                    # 算法核心
        │   ├── __init__.py
        │   ├── ppo.py                     # PPO 算法实现（Actor-Critic + GAE + 裁剪目标）
        │   └── ppo_amp.py                 # PPO + AMP（对抗运动先验，Adversarial Motion Priors）
        ├── env/
        │   ├── __init__.py
        │   └── vec_env.py                 # 向量化环境封装（Isaac Gym 多环境并行）
        ├── modules/                       # 神经网络模块
        │   ├── __init__.py
        │   ├── actor_critic.py            # Actor-Critic 网络（MLP, ELU, 支持镜像对称）
        │   ├── actor_critic_recurrent.py  # 循环 Actor-Critic（GRU 支持）
        │   └── discriminator.py           # AMP 判别器网络
        ├── runners/                       # 训练/推理运行器
        │   ├── __init__.py
        │   ├── on_policy_runner.py        # On-Policy 运行器（rollout → 学习 → 日志）
        │   └── on_policy_runner_amp.py    # AMP 运行器
        ├── storage/                       # 经验存储
        │   ├── __init__.py
        │   ├── rollout_storage.py         # Rollout 缓冲区（obs/action/reward/done/value）
        │   └── replay_buffer.py           # AMP 回放缓冲区
        └── utils/                         # 工具函数
            ├── __init__.py
            ├── utils.py                   # 通用工具
            ├── motion_loader.py           # 动作捕捉数据加载
            └── motion_utils.py            # 动作数据处理
    ```

- Program/zoomlion\_legged\_gym/ — 训练框架

    - 自研 Isaac Gym 训练框架，包含环境定义、训练/重放脚本、策略导出、sim2real 部署工具。

    ```txt
    Program/zoomlion_legged_gym/
    ├── setup.py                           # pip 安装入口
    ├── README.md / README_CN.md
    ├── legged_gym/
    │   ├── __init__.py
    │   ├── envs/
    │   │   ├── __init__.py                # 任务注册表（TaskRegistry）
    │   │   ├── base/                      # 基类
    │   │   │   ├── base_config.py         # 基础配置数据类
    │   │   │   ├── base_task.py           # 基础任务（step/reset/compute_reward）
    │   │   │   ├── legged_robot.py        # 足式机器人基类
    │   │   │   ├── legged_robot_config.py # 机器人配置基类
    │   │   │   ├── legged_robot_mimic.py  # 模仿学习基类
    │   │   │   ├── legged_robot_stand.py  # 站立任务基类
    │   │   │   └── legged_robot_walk.py   # 行走任务基类
    │   │   └── t4/                        # T4 机器人任务
    │   │       ├── t4_march.py            # 原地踏步任务（v2 新实现）
    │   │       ├── t4_march_config.py     # 踏步配置
    │   │       ├── t4_kick.py             # 踢球任务
    │   │       └── t4_kick_config.py      # 踢球配置
    │   ├── scripts/                       # 入口脚本
    │   │   ├── train.py                   # 训练启动脚本
    │   │   ├── play.py                    # 重放/可视化脚本（同时导出策略）
    │   │   ├── export_policy.py           # 导出 TorchScript 策略
    │   │   ├── export_onnx.py             # 导出 ONNX 策略
    │   │   └── record_config.py           # 记录配置信息
    │   ├── utils/                         # 工具
    │   │   ├── __init__.py
    │   │   ├── helpers.py                 # 辅助函数
    │   │   ├── logger.py                  # 日志记录（TensorBoard）
    │   │   ├── math.py                    # 数学工具
    │   │   ├── task_registry.py           # 任务注册器（按名称查找任务类）
    │   │   └── terrain.py                 # 地形生成
    │   └── logs/                          # 训练日志（本地示例）
    │       └── t4_stand_ppo/
    │           └── exported_data/         # t4_stand 训练的导出产物
    ├── sim2real_deploy/                   # 真机部署
    │   ├── __init__.py
    │   ├── export_onnx_policy.py          # ONNX 策略导出（sim2real）
    │   └── zqsa01_policy.onnx             # 已导出的 ONNX 策略
    └── logs/                              # 训练日志输出目录
    ```

    - 这部分需要的改动是最多的：机器人的 URDF 模型、环境类、观测/动作空间、奖励函数、配置文件都要定制

- Program/sim2sim\_mujoco/ — MuJoCo 评测套件

    - 使用 MuJoCo 物理引擎验证训练好的策略，实现 sim2sim 迁移验证。

    ```txt
    Program/sim2sim_mujoco/
    ├── sim2sim_t4_march.py                # t4_march 评测脚本（v2，自带 PASS/FAIL 判定）
    ├── sim2sim_t4_kick.py                 # t4_kick 评测脚本
    ├── t4_march_config.yaml               # t4_march 评测配置
    ├── t4_kick_config.yaml                # t4_kick 评测配置
    └── resources/                         # 评测用机器人资产（独立副本）
        ├── t4_std.xml                     # MuJoCo 模型（29 DOF）
        └── meshes/                        # 35 个 3D 网格文件
    ```

- resources/T4\_std/ — 机器人资产

    - T4 人形机器人的物理/几何描述文件。

    ```txt
    resources/T4_std/T4_std/
    ├── urdf/
    │   └── t4_std.urdf                    # URDF 模型（Isaac Gym 训练用）
    ├── xml/
    │   └── t4_std.xml                     # MuJoCo XML 模型（评测用）
    ├── meshes/                            # 3D 网格（35 个 .STL/.stl 文件）
    │   ├── torso_link.stl                 # 躯干
    │   ├── waist_yaw_link.stl             # 腰部偏航
    │   ├── head_yaw_link.stl              # 头部
    │   ├── T4Lhand.STL / T4Rhand.STL     # 左右手
    │   ├── left_*.stl                     # 左半身 14 个连杆（肩/肘/腕/髋/膝/踝）
    │   ├── right_*.stl                    # 右半身 14 个连杆
    │   └── left_foot.STL / right_foot.STL # 左右脚（碰撞网格）
    └── URDF版本差异问题报告.md             # URDF 版本差异说明
    ```

- march\_policy/ — t4\_march 训练产物

    - 云端训练平台产出的模型 checkpoint 与最终策略。

    ```txt
    march_policy/
    └── M2026022121_2026613085318/         # 训练任务实例 ID
        └── logs/t4_march_ppo/
            ├── exported_data/             # 训练过程文件
            │   └── 2026-06-11_01-44-12inplace_v2/
            │       ├── model_{0..20000}.pt           # 11 个 checkpoint（间隔 2000 iter）
            │       ├── t4_march.txt / t4_march_config.txt
            │       ├── legged_robot_config.txt
            │       └── legged_robot_stand/walk.txt
            └── 0_exported/policies/
                └── policy_1.pt            # 最终导出策略（TorchScript，490 维输入）
    ```

- 技术栈与运行环境

|项目|说明|
|---|---|
|算法|PPO（Actor\-Critic \+ GAE \+ 左右镜像对称损失）|
|网络|MLP \[512, 256, 128\] \+ ELU 激活|
|训练引擎|Isaac Gym Preview 4（PhysX, GPU 加速）|
|评测引擎|MuJoCo（CPU 物理）|
|Python|3\.8（训练）/ 3\.10（评测）|
|PyTorch|1\.13\.1 \+ CUDA 11\.7|
|并行环境数|4096（训练）/ 128（重放）|
|控制频率|50 Hz 策略 / 200 Hz PD|
|观测维度|490（98×5 frame\_stack）|
|动作维度|29（关节目标增量，`target = action × 0.25 + default`）|

- 架构设计

    - 类继承链（环境层）

    ```txt
    BaseTask                        # Isaac Gym 基类（sim 创建、查看器）
    └── LeggedRobot               # 通用四足机器人（地形、PD 控制、域随机化、碰撞检测）
            ├── LeggedRobotWalk      # 多步态行走（步态切换、步态命令采样）
            └── LeggedRobotStand     # 站立/踏步基类（步态相位跟踪、frame_stack、延迟缓冲）
                ├── T4March        # 原地踏步（相位驱动步态、摆动腿参考、摔倒检测）
                └── T4Kick         # 原地踢球（球奖励、踢腿参考轨迹、课程学习）
    ```

    - 数据流

    ```txt
    训练流程:
    train.py → TaskRegistry.make_env() → T4March / T4Kick 环境
            → TaskRegistry.make_alg_runner() → OnPolicyRunner → PPO.learn()
    重放/导出:
    play.py → 加载 JIT 策略 → env.step() 渲染 → 同时导出 policy_1.pt
    export_policy.py → torch.jit.script() → policy_1.pt
    export_onnx.py   → torch.onnx.export() → onnx_1.onnx
    Sim2Sim 评测:
    sim2sim_t4_march.py → 加载 policy_1.pt + YAML 配置 → MuJoCo 物理 → 指标 + PASS/FAIL
    ```

- 关键架构决策

|决策|说明|
|---|---|
|训练/评测引擎分离|Isaac Gym \(PhysX\) 训练，MuJoCo \(CPU\) 评测，防止仿真作弊|
|frame\_stack=5|堆叠 5 帧历史观测，使策略感知时序动态（490 维输入）|
|左右镜像对称损失|利用人形机器人对称性，增大有效样本量（t4\_kick 踢球任务关闭）|
|动作增量式控制|策略输出关节目标增量 `target = action × 0.25 + default`，更平滑|
|域随机化|全面随机化（摩擦/质量/PD/延迟/噪声/推搡），提升 sim2real 迁移能力|
|课程学习|t4\_kick 先站稳（0\~1500 iter）再踢球（1500\~6000 iter 渐进）|

- 典型工作流

    ```txt
    调试机 → 训练任务（Isaac Gym + PPO）
                ↓
        重放任务（play.py → 导出 policy_1.pt）
                ↓
        MuJoCo 评测任务（sim2sim 验证）
                ↓
        Sim2real 部署（ONNX 导出 → 真机）
    ```

### 项目部署流程\+RL流程说明

在装任何东西之前，先确认你的机器满足条件，否则后面会白折腾：

|要求|说明|为什么|
|---|---|---|
|**操作系统：Linux（Ubuntu 20\.04 / 22\.04）**|Isaac Gym **只支持 Linux**，不支持原生 Windows/macOS|训练引擎 Isaac Gym Preview 4 的 GPU 物理只在 Linux 上有驱动|
|**NVIDIA 显卡（非 50 系）**|训练必须要 N 卡；**RTX 50 系（Blackwell）跑不了 Isaac Gym**|PhysX GPU 加速不兼容 Blackwell 架构（前言里已提到）|
|**显存 ≥ 8 GB**|4096 个并行环境比较吃显存|不够的话把 `--num_envs` 调小（如 1024）|

> **Windows 用户怎么办？** 两条路：① 装双系统 Ubuntu（最稳）；② 用 **WSL2 \+ Ubuntu**（Win11 的 WSLg 能显示图形界面，可视化重放也能用）。不管哪条路，**训练部分必须在 Linux 环境里跑**。

> 最后一步的 **MuJoCo 评测是纯 CPU 的**，Windows / macOS / Linux 都能直接跑，不需要 N 卡。所以就算你暂时没有训练环境，也能先在 Windows 上把"评测"这一环跑起来体验。

后面的命令默认你已经进入仓库根目录：

```bash
cd rc-train-ppo        # 进入项目根目录，后面所有相对路径都以这里为基准
```

#### 第 1 步：创建独立的 Python 环境（conda）

用 conda 单独开一个 Python 3\.8 的"隔离房间"，把这个项目的依赖都装在里面，不污染系统 Python，也不会和其他项目打架。

```bash
conda create -n t4rl python=3.8 -y   # 新建一个叫 t4rl 的环境，指定 Python 3.8
conda activate t4rl                  # 进入这个环境（之后每次开新终端都要先 activate）
```

> 判断有没有进对环境：命令行提示符前面会出现 `(t4rl)`。之后所有 `pip install` / `python` 都必须在这个环境里执行。

#### 第 2 步：安装 PyTorch（指定 CUDA 11\.7 版本）

装深度学习框架 PyTorch，神经网络（policy）的前向、反向传播、梯度更新都靠它。

**为什么要指定版本**：PyTorch 必须和 CUDA 版本匹配才能用上 GPU。这个项目在 CUDA 11\.7 上验证过，直接照抄这行最省事：

```bash
pip install torch==1.13.1+cu117 torchvision==0.14.1+cu117 torchaudio==0.13.1 \
  --extra-index-url https://download.pytorch.org/whl/cu117
```

装完可以验证一下 GPU 是否可用：

```bash
python -c "import torch; print(torch.__version__, torch.cuda.is_available())"
# 期望输出类似：1.13.1+cu117 True   （True 表示能用到显卡）
```

#### 第 3 步：安装 Isaac Gym（训练引擎）

Isaac Gym 是前面反复提到的"环境 / 物理裁判"——它在 GPU 上并行仿真几千个机器人，负责算物理、给状态、执行动作。没有它，训练跑不起来。

1. 到 [https://developer\.nvidia\.com/isaac\-gym](https://developer.nvidia.com/isaac-gym) 下载 **Isaac Gym Preview 4**，解压。

2. 用 `pip install -e .` 把它装成"可编辑模式"（editable，见下方说明）：

```bash
cd isaacgym/python && pip install -e .
```

3. 跑个官方示例确认装好了（能弹出一堆小球在弹跳就说明成功）：

```bash
cd examples && python 1080_balls_of_solitude.py
```

> **什么是 ****`pip install -e .`****（editable 可编辑安装）？** 普通安装会把代码复制一份到 Python 的库目录；`-e` 则是"原地安装"——只建立一个软链接指向你的源码目录。这样你**改了源码立刻生效**，不用每次重装。RL 项目要频繁改环境、改奖励函数，所以全程都用 `-e`。

> 装不上时看 `isaacgym/docs/index.html` 排错；常见问题是缺 `libpython3.8` 或找不到 Vulkan 驱动。

#### 第 4 步：安装算法库和训练框架

把项目自带的两个包装进环境

- `rsl_rl`：PPO 算法本体

- `zoomlion_legged_gym`：训练框架，里面有 T4 的环境定义、训练/重放脚本、奖励函数。

```bash
# 装 PPO 算法库
cd Program/rsl_rl && pip install -e . --no-deps && cd ../..

# 装训练框架
cd Program/zoomlion_legged_gym && pip install -e . --no-deps && cd ../..
```

> **为什么加 ****`--no-deps`****（不装依赖）？** 因为这两个包的 `setup.py` 里写了 `torch`、`numpy` 等依赖，如果不加 `--no-deps`，pip 可能会自作主张把你第 2 步精心装好的 `torch==1.13.1+cu117` 覆盖成别的版本，导致 CUDA 对不上。`--no-deps` 就是告诉 pip"只装这个包本身，依赖我自己管"。剩下的零散依赖（tensorboard、mujoco、pygame 等）如果报缺，按提示 `pip install` 单独补即可。

#### 第 5 步：修好本地的资产路径（本地部署专属的坑）

让训练框架能找到机器人的 URDF/XML 模型文件。

代码在云平台上是靠环境变量 `CMP_SIM_ROBOT_ASSET_PATH_PREFIX` 定位资产的；本地这个变量为空，代码就会回退到默认相对路径 `Program/T4_std/T4_std/...`。但仓库里资产实际放在 **`resources/T4_std/T4_std/...`**（根目录下），两个位置对不上，直接跑会报"找不到 URDF"。

最省事的解法是建一个软链接，把代码期望的位置指向真实资产：

```bash
# 在仓库根目录执行：让 Program/T4_std 指向 resources/T4_std
ln -s "$(pwd)/resources/T4_std" Program/T4_std
```

> 不想用软链接的话，`cp -r resources/T4_std Program/T4_std` 直接复制一份也行（多占一点磁盘）。验证：`ls Program/T4_std/T4_std/urdf/t4_std.urdf` 能列出文件就对了。

> 这个坑的根源写在 `doc/CLAUDE.md` 第 4 节：资产 Code 在代码里写死成 `2efe7gt1`，只有走平台环境变量时才拼这个 Code；本地不走环境变量，用的是相对路径，所以只需保证 `Program/T4_std/` 存在即可。

#### **第 6 步：冒烟测试——正式训练前，先确认整条链路是通的**

**为什么要做这步**：一次正式训练要跑几个小时。如果环境没装对、资产路径错了、或者训练代码本身有 bug，跑了好几天最后才发现，纯属浪费时间。所以在开大任务之前，我们先用几分钟做一遍"冒烟测试"——只要有一处冒烟（报错）就先修好。**冒烟测试不只是跑评测**，要把"训练环境、训练代码、评测环境"三样都过一遍。我们分三小步，由浅入深：

**6\.1　可视化调试：打开 Isaac Gym 窗口，肉眼看机器人**

先不谈学习效果，只确认**训练引擎能正常加载机器人、物理仿真没崩**。开着渲染窗口跑几百个环境，看机器人有没有正确地站在地面上（而不是穿地、飞天、肢体乱飘），关节摆动是否正常。这一步专门用来暴露"资产路径 / URDF / 显卡驱动"这类底层问题。

```bash
export GRAPHICS_DEVICE_ID=0    # 设为 0 = 开启渲染，我们要看画面

python Program/zoomlion_legged_gym/legged_gym/scripts/train.py \
  --task=t4_march \
  --num_envs=64                # 只开少量环境，方便观察、也不吃显存
```

窗口弹出后能看到一片 T4 站在地面上、开始尝试踏步，就说明**训练引擎、机器人资产、物理仿真这一层没问题**。如果这里就报"找不到 URDF"或直接段错误，回到第 5 步（资产软链接）和第 3 步（Isaac Gym）排查，别往下走。

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZmQzZDU5ZjVkNWIzMmFiMDNhMmQyODM0ZjY1YmIzNmFfNjY4NWRjOGJkYjZhYzlhYzVmYTlhNjhjMTdiODEwYmNfSUQ6NzY1OTc0NTM3NTExNjc3NDM1N18xNzgzNjg3NTA3OjE3ODM3NzM5MDdfVjM)



> 观察够了按 `v` 可以关掉渲染加速，或直接 `Ctrl+C` 退出——这一步只为看一眼，不需要真的训练。
> 
> 

**6\.2　小规模试训：10 轮 × 128 环境，验证训练代码能跑通并正确产出策略**

可视化只证明"仿真能跑"，还没证明"**训练全流程能跑通**"——即 PPO 的采样、更新、存档、导出这条链路有没有 bug。所以我们**故意开一个极小的训练任务**：只跑 10 轮迭代、128 个环境。它几乎学不到东西，但目的不是学东西，而是**验证整条训练管线能从头走到尾、并正确生成策略文件**。

```bash
export GRAPHICS_DEVICE_ID=-1   # 试训不看画面，无头更快

python Program/zoomlion_legged_gym/legged_gym/scripts/train.py \
  --task=t4_march \
  --headless \
  --num_envs=128 \             # 少量环境，几十秒就能跑完
  --max_iterations=10          # 只跑 10 轮，纯粹验证流程
```

跑完不报错，只是第一关。**关键是要检查它有没有正确产出模型文件**：

```bash
ls Program/zoomlion_legged_gym/logs/t4_march_ppo/    # 应能看到按时间戳命名的本次运行文件夹，里面有 model_*.pt
```

能看到 \`model\_\*\.pt\` 存档，说明**训练代码、PPO 更新、日志和存档这条链路全部正确**。这一步才是你标题里说的核心：**这个小任务成功、并且正确生成了策略文件，才有资格正式开始几小时的大训练。**

> 顺手可以把这个 10 轮的存档用第 9 步的 \`play\.py\` 导出成 \`policy\_1\.pt\`，再喂给下面 6\.3 的评测——这样连"导出→评测"的接口也一起验证了（策略是随机的、肯定 FAIL，但**流程能不能跑通**才是这一步要看的）。
> 
> 

**6\.3　评测环境自检：用预训练策略跑一遍 MuJoCo**

前两步验证的是训练侧（Isaac Gym）。最后单独确认**评测侧（MuJoCo）也就绪**。仓库里 \`march\_policy/\` 已经有一份**云端训练好的策略** \`policy\_1\.pt\`，直接拿它跑评测，几十秒就能看到窗口，是最快的"评测环境自检"。

```bash
cd Program/sim2sim_mujoco

# --policy 指向仓库里预训练好的策略；--config 用本目录的评测配置
python3 sim2sim_t4_march.py \
  --policy ../../march_policy/M2026022121_2026613085318/logs/t4_march_ppo/0_exported/policies/policy_1.pt \
  --config t4_march_config.yaml
```

弹出 MuJoCo 窗口、机器人站着原地踏步、结束时打印指标和 \`PASS/FAIL\`（这份是训好的策略，应当 PASS），说明**评测环境也全部就绪**。看不到窗口就加 \`\-\-headless\` 只看指标。

\[VID\_20260707\_193653\.mp4\]

三小步都通过后，才进入第 7 步的正式训练。

> **注意配置文件名**：\`doc/\` 里的旧说明写的是 \`t4\_march\_standalone\_config\.yaml\`，但仓库里实际的文件叫 **\*\*\`t4\_march\_config\.yaml\`\*\***，以实际文件名为准。评测用的 \`resources/\`（\`t4\_std\.xml\` \+ \`meshes/\`）已经放在 \`Program/sim2sim\_mujoco/\` 目录里了，不用额外准备。
> 
> 

#### 第 7 步：启动训练

这才是 RL 的主体——让几千个 T4 在 Isaac Gym 里反复试错、由 PPO 一轮轮更新策略网络。对应第 80 节那个"读状态→算动作→执行→打分"的循环，只不过一次几千个环境并行、跑几万轮。

```bash
export GRAPHICS_DEVICE_ID=-1   # 训练不需要画面，设为 -1 = 无头模式，省显存、提速

python Program/zoomlion_legged_gym/legged_gym/scripts/train.py \
  --task=t4_march \
  --headless \
  --num_envs=4096 \
  --max_iterations=20000
```

每个参数的含义：

|参数|含义 / 作用|
|---|---|
|`GRAPHICS_DEVICE_ID=-1`|环境变量，`-1` 表示不开渲染窗口（无头）。训练时没人看画面，关掉更快更省显存|
|`--task=t4_march`|选哪个任务。`t4_march` = 原地踏步（也可选 `t4_kick` 踢球）|
|`--headless`|同样是关闭图形界面，和上面的环境变量配合|
|`--num_envs=4096`|并行多少个机器人。越多数据收集越快，但越吃显存。显存不够就调小（如 1024）|
|`--max_iterations=20000`|训练多少轮后停止。经验：**3000–5000 轮**能看到稳定踏步的雏形|

其他常用参数：`--resume`（接着上次训）、`--load_run`/`--checkpoint`（指定加载哪次/哪个存档）、`--seed`（随机种子，复现用）、`--sim_device=cpu --rl_device=cpu`（没 GPU 时纯 CPU 跑，很慢，仅用于调试代码）。

> **单卡就够，别用多卡**：`doc/README_t4_march.md` 提示多卡（torchrun）路径里 `rsl_rl` 有个 bug 会崩，4096 个环境单卡完全够用，**按默认单卡跑即可**。

> **训练产物存在哪**：本地不设平台环境变量时，日志和模型默认存到 `Program/zoomlion_legged_gym/logs/t4_march_ppo/` 下，按时间戳分文件夹，每隔 2000 轮存一个 `model_xxxx.pt`。

#### 第 8 步：监控训练过程（TensorBoard）

训练要跑几个小时，得有办法实时看它到底学得好不好，而不是干等。框架把奖励、损失等指标都写进了 TensorBoard 日志。

```bash
# 另开一个终端（记得先 conda activate t4rl）
tensorboard --logdir Program/zoomlion_legged_gym/logs/t4_march_ppo
# 然后浏览器打开 http://localhost:6006
```

**重点看这几条曲线**（判断训得好不好）：

- `Episode/rew_gait_contact`、`rew_feet_swing_height` **持续上行** → 步态在成形（脚在按节奏抬落）。

- `mean_episode_length` **接近 1000** → 机器人越来越不摔了（一个 episode 最长 1000 步，摔了会提前终止）。

- `Loss/value_function`、`Loss/surrogate` 平稳下降/收敛 → PPO 学习正常，没训崩。

> 如果 `mean_episode_length` 一直很短，说明机器人频繁摔倒、拿不到有效学习信号——优先去调稳定性相关的奖励权重（`doc/README_t4_march.md` 第 6 节有一张"现象→调哪个参数"的速查表）。

#### 第 9 步：重放并导出策略

训练存下的 `model_xxxx.pt` 是完整的训练模型（含 Actor\+Critic、优化器状态），不能直接部署。`play.py` 会加载训练好的模型，**在 Isaac Gym 里可视化重放**给你看效果，同时把 Actor 单独抽出来、导出成一个精简的 **`policy_1.pt`**（TorchScript 格式，输入 490 维，可脱离训练框架独立运行）。

```bash
export GRAPHICS_DEVICE_ID=0   # 重放要看画面，设为 0 = 开启渲染

python Program/zoomlion_legged_gym/legged_gym/scripts/play.py \
  --task=t4_march \
  --num_envs=2          # 重放只需要少量环境，2 个就够看
```

导出的策略在：

```txt
Program/zoomlion_legged_gym/logs/t4_march_ppo/0_exported/policies/policy_1.pt
```

> 默认加载"最新一次训练的最后一个存档"。想指定别的，在训练配置里设 `load_run` / `checkpoint`。

> **可选：导出 ONNX**（给真机 C\+\+ 端部署用，输入 1×490）：

```bash
python Program/zoomlion_legged_gym/legged_gym/scripts/export_onnx.py --task=t4_march
```

#### 第 10 步：用 MuJoCo 评测你自己训的策略

把上一步导出的 `policy_1.pt` 换成你自己训练的那份，重新跑第 6 步的评测。

**为什么要专门再做一次评测、而且故意换个引擎？**

先说一个 RL 里绕不开的核心难题——**sim2real gap（仿真与现实的差距）**。策略是在仿真里训练出来的，但仿真永远不等于真实世界：接触碰撞怎么算、摩擦力多大、关节有多少弹性和延迟、积分用什么算法……每个仿真器都有自己的一套近似。真机上这些物理量又是另一套。于是常常出现"仿真里走得很好，一上真机就摔"的情况，这个落差就是 sim2real gap。我们做评测，本质就是想在上真机之前，**尽量早地把这个 gap 暴露出来**。

那为什么不在训练用的 Isaac Gym 里评测，而要换成 MuJoCo？因为 **PPO 是个"极致的应试选手"**——它的唯一目标就是把奖励刷到最高，它不在乎用什么手段。如果训练环境（PhysX）的物理有任何一点不真实的"甜头"，策略就会精准地利用它来拿分。举几个具体的"仿真作弊"例子：

- **钻接触模型的空子**：PhysX 算脚地接触的方式和真机不一样，策略可能学会一种"卡"在某个接触状态下、看起来站得很稳但真机根本复现不了的姿势。

- **利用数值积分的误差**：靠仿真器积分器的微小误差硬撑平衡，换个积分算法（MuJoCo 用的不一样）立刻站不住。

- **过拟合到某个固定参数**：训练里摩擦、质量如果没随机化，策略会死记这一组数值，一旦变了就崩。

这些"作弊"的共同特点是：**它们只在训练那个特定引擎里成立，一换环境就失效**。而真机就相当于"又一个不同的环境"。所以我们用第二个物理引擎（MuJoCo）来当"考官"——它和 Isaac Gym 是**两套独立实现的物理**（不同的接触模型、不同的积分器、CPU 而非 GPU），彼此的近似误差不一样。

于是逻辑就清晰了：**如果一个策略在 PhysX 训练、换到 MuJoCo 还能稳稳踏步，说明它学到的是"真正的平衡能力"，而不是某个引擎的 bug。** 反过来，只要它在换引擎后就摔，几乎可以断定它带着上面那些"作弊"，真机必挂。这就是把评测叫做 **sim2sim（仿真到仿真）迁移验证** 的原因，它是通往 sim2real 的第一道、也是最便宜的一道关卡：

> **训练引擎 → 评测引擎（sim2sim）→ 真机（sim2real）**，每跨一步，环境的差异就更大一层。能扛过 sim2sim 这一跳的策略，才有资格去挑战差异更大的真机。**跨引擎还能走 = sim2real 的最低门槛（注意只是"最低门槛"，过了也不保证真机一定行，但过不了就一定不行）。**
> 
> 

这也是为什么这个项目在训练侧下了那么大功夫做**域随机化**（摩擦/质量/PD/延迟/噪声/推搡全都随机抖动）：故意在训练时就不让策略依赖任何一组固定的物理参数，逼它学出一个"对物理细节不敏感"的鲁棒策略。域随机化是"主动缩小 gap"，sim2sim 评测是"被动检验 gap 有没有缩小"，两者配合才能提高真机成功率。

```bash
cd Program/sim2sim_mujoco

python3 sim2sim_t4_march.py \
  --policy ../zoomlion_legged_gym/logs/t4_march_ppo/0_exported/policies/policy_1.pt \
  --config t4_march_config.yaml
# 可加 --plot 画曲线、--save 存动作 CSV、--headless 无窗口快速回归
```

脚本结束会自动打印指标汇总和 `PASS/FAIL`。判定标准（写在 yaml 的 `eval` 段，可调）大致是：不摔倒、水平漂移 ≤0\.5m、朝向漂移 ≤0\.6rad、每脚步频 1\.0±0\.3Hz、平均抬脚 ≥3cm、躯干高度均值 0\.78–0\.88m。**评测不 PASS，就不要上真机。**

#### 第 11 步（可选）：上真机 sim2real

评测 PASS 后才考虑真机。核心是保证**部署侧的观测拼接顺序、关节顺序、零位、PD 参数、相位计算方式与训练完全一致**，任何一处对不上都会导致真机行为和仿真差很远。首测务必吊装、先用 50% 力矩限幅试运行、无线急停随手可及。完整检查清单见 `doc/README_t4_march.md` 第 5 节。

#### 常见报错排查

|报错 / 现象|原因|解决|
|---|---|---|
|找不到 URDF / XML 文件|第 5 步的资产软链接没建|`ln -s "$(pwd)/resources/T4_std" Program/T4_std`|
|`torch.cuda.is_available()` 是 False|PyTorch 和 CUDA/驱动版本不匹配|重装第 2 步的 `+cu117` 版本；确认 N 卡驱动已装|
|Isaac Gym 导入报错 / 段错误|显卡是 50 系，或驱动/Vulkan 问题|50 系无法用 Isaac Gym（改用 Isaac Lab）；否则查 Isaac Gym 文档|
|训练时显存 OOM|`--num_envs` 太大|调小到 1024 或更少|
|`pip` 把 torch 覆盖了|装项目包时没加 `--no-deps`|重装第 2 步的 torch，之后装包一律加 `--no-deps`|
|评测报缺 `mujoco` 等模块|零散依赖没装全|`pip install mujoco mujoco-python-viewer pygame scipy pyyaml pynput matplotlib tqdm`|
|找不到配置文件|文件名记成了旧名|用实际文件名 `t4_march_config.yaml`|

### 项目改造说明

前面跑通的框架以及提供的开源框架是给人形机器人或者机器狗设计的，而我们的最终目标是轮腿。所以我们以这个已经跑通的框架为例，说明一个RL框架要如何改造，其他的RL框架也遵循类似的逻辑

#### **一、要动哪些文件（对照目录）**

改造集中在这几处，和第一章的目录结构对应：

```txt
Program/zoomlion_legged_gym/legged_gym/
├── envs/
│   ├── <你的轮腿>/                    # 【新建】机器人任务目录
│   │   ├── wheel_legged.py            #   新环境类（继承基类，改观测/奖励/控制）
│   │   └── wheel_legged_config.py     #   新配置（改维度/关节/PD/奖励权重）
│   └── __init__.py                    # 【改】注册新任务
├── envs/base/
│   └── legged_robot_stand.py          # 【可能要改】_compute_torques 加轮子速度控制
resources/
└── <你的轮腿>/                        # 【新建】URDF + XML + meshes
Program/sim2sim_mujoco/
├── sim2sim_<轮腿>.py + <轮腿>.yaml    # 【新建/改】评测脚本与配置（协议要和训练一致）
sim2real_deploy/                       # 【改】真机部署协议
```

#### **二、核心改造清单（逐项对照配置）**

下面对照 `t4_march_config.py` 的各个 `class`，说明每一块要怎么改、为什么。

**1\. 机器人模型（****`class asset`**** \+ ****`resources/`****）**

把轮腿的 **URDF（Isaac Gym 训练用）和 XML（MuJoCo 评测用）** 及 `meshes/` 放进 `resources/<轮腿>/`，然后改 `asset.file` / `xml_file` 指过去。再把里面写死的 body 名字全部换成轮腿的：`foot_name`、`feet_name` 这些"脚"的概念，对轮腿要改成"轮子"的 link 名；`arms_name`、`waists_name`、`shoulders_name` 等原有分组直接删掉。

> URDF 里轮子关节的 `<joint>` 类型要是 `continuous`（连续旋转），别写成 `revolute`（有限位）。
> 
> 

**2\. 维度定义（****`class env`****）**

这是牵一发动全身的地方。轮腿 DOF 远少于 29，假设你的轮腿是 `num_actions = N`，就要同步改：

- `num_actions`：等于可驱动关节数（腿关节 \+ 轮子）。

- `num_single_obs`：单帧观测维度，要跟着你在环境代码里实际拼了哪些量算清楚（见下方第 6 点）。

- `num_observations = frame_stack * num_single_obs`、`single_num_privileged_obs` / `num_privileged_obs` 同理。

> **维度对不上是最高频的崩溃原因**：配置里写的 `num_observations` 必须和环境代码里 `obs_buf` 实际拼出来的长度**一模一样**，差一个都会在启动时报 shape 错误。改完务必用第 6 步的"小规模试训"验证。
> 
> 

**3\. 站立姿态（****`class init_state`****）**

`pos`（出生高度 z）按轮腿自然站立高度设；`default_joint_angles` 换成轮腿每个关节的默认角度（**轮子默认角度设 0 即可，反正它要转**）。

**4\. 控制方式（****`class control`**** \+ 可能改 ****`_compute_torques`****）**

这是轮腿改造**技术上最硬的一块**。原框架的 \`\_compute\_torques\`（在 \`legged\_robot\_stand\.py\`）里写死了纯位置 PD：

```python
torques = p_gains * (actions + default_dof_pos - dof_pos + offset) - d_gains * dof_vel
```

这对腿关节没问题，但**轮子需要的是速度控制**——你希望动作输出的是"轮子目标转速"，而不是"轮子目标角度"。所以要给轮子 DOF 单独处理，思路是：

- 腿关节：沿用位置 PD（上面那行）。

- 轮子关节：改成速度控制，`torque = kd_wheel * (action_target_vel - dof_vel)`，即 `kp=0`、只用速度误差出力矩。

实现上通常是在 `_compute_torques` 里按 DOF 索引把轮子和腿分开算，再拼回去。`stiffness` / `damping` 字典也要给轮子配上（轮子 `stiffness=0`）。

**5\. 指令与课程学习（****`class commands`****）**

人形 march 的指令**恒为 0**（原地踏步）；轮腿正相反，核心任务就是**跟踪速度指令**。所以：

- `use_gait_phase` 改 `False`（轮腿没有步态相位，把相关机制关掉）。

- `ranges.lin_vel_x` / `ang_vel_yaw` 给出真实的速度范围（比如前进 0\~1\.5 m/s、转向 ±1 rad/s）。

- 打开 `curriculum`：**从小速度范围开始，训得好了再自动加大**——轮腿一上来就要求高速容易学不会，循序渐进更稳（类似 `t4_kick` 先站稳再踢球的思路）。

**6\. 观测拼接（环境代码 ****`compute_observations`****）**

对照 `t4_march_config.py` 头部注释的观测布局，轮腿版要重写成：指令（vx, wyaw）\+ 腿关节的 `(q-default)` 和 `dq` \+ **轮子只放 dq（转速），不放 q** \+ 上次动作 \+ 机身角速度 \+ 投影重力。**删掉 sin/cos 相位那 2 维**（没有步态相位了）。改完把实际拼出的长度回填到 `num_single_obs`。

**7\. 奖励函数（****`class rewards`**** —— 改动最大）**

把人形的步态奖励**整块删掉**，换成轮腿平衡\+跟踪的奖励。这是决定能不能训出来的核心：

|处理|原 T4 的项（删除）|轮腿要加的项|
|---|---|---|
|删|`gait_contact`、`feet_swing_height`、`gait_joint_ref`、`feet_orientation`、`feet_slide` 等所有步态/落脚相关|—|
|删|`swing_arm`、`joint_deviation_arms/waists` 等人形部位项|—|
|加|—|`tracking_lin_vel`（跟踪线速度指令，正奖励，通常权重最大）|
|加|—|`tracking_ang_vel`（跟踪转向指令）|
|改|`base_height_target=0.84`|改成轮腿目标高度；保留 `base_height` 惩罚|
|保留|`flat_orientation_l2`、`base_angular_velocity`|**强化**这两项——轮腿是倒立摆，保持机身竖直/不乱晃是活下去的关键|
|改|摔倒终止 `termination_gravity_xy`|保留，倾角阈值按轮腿调（轮腿更容易翻）|
|保留|`action_rate`、`action_smoothness`、`energy`、`dof_pos_limits`|正则项保留，让动作平滑省电|

**8\. 对称性损失（****`class algorithm`**** 的 ****`obs_permutation`**** / ****`act_permutation`****）**

轮腿通常仍是左右对称的，镜像损失能提采样效率，可以保留。但那两张排列表是**按 29 DOF 的具体顺序逐位写死的**，维度一变就完全对不上、会直接崩。**改造初期最省心的做法是先 ****`sym_loss = False`**** 关掉它**，等整个流程跑通、确认能训出来了，再回头按轮腿的关节顺序重写排列表。

**9\. 评测侧同步（****`Program/sim2sim_mujoco/`****）**

训练侧改了什么，评测侧（MuJoCo 的 XML、yaml 里的 obs 协议、PD、控制方式）就要**原样同步**。第 10 步讲过：训练和评测两侧协议差一点，sim2sim 必挂。轮子的速度控制、观测里"轮子只喂转速"这些，评测脚本里也要一模一样地实现。

> **删掉"迈步"的一整套机制（步态相位、摆动腿、落脚），换成"平衡车 \+ 腿"的思路（速度跟踪 \+ 保持竖直），并单独把轮子做成速度控制、观测里只喂转速。** 其余的训练/评测/部署流程，和前面跑通 T4 时完全一样。
> 
> 