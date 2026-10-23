<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0EA5E9,50:38BDF8,100:BAE6FD&height=190&width=640&section=header&animation=fadeIn" width="640" alt="Sky blue animated header" />

</div>

# Hi, I'm XiaoGao 👋

> *Firmware that meets its deadlines. Models that earn their answers.*

[![Followers](https://img.shields.io/github/followers/Ashleycurry?label=Followers&style=flat&color=38BDF8)](https://github.com/Ashleycurry?tab=followers)
[![Stars](https://img.shields.io/github/stars/Ashleycurry?affiliations=OWNER&label=Stars&style=flat&color=0EA5E9)](https://github.com/Ashleycurry?tab=repositories)
![Profile views](https://hits.sh/github.com/Ashleycurry.svg?label=Profile%20views&style=flat&color=0284C7)

---

## About Me

I'm an embedded software and applied AI engineer. Most of my work sits where deterministic firmware meets LLM tooling: register-level drivers and RTOS scheduling on one side, retrieval pipelines and model integration on the other.

I care about the parts that are easy to skip — bounded memory, explicit interfaces, documented failure modes, and validation that runs on every change. I write it all down as I go, because a system you can't explain is a system you can't maintain.

---

## What I'm Working With

**Embedded & Hardware**

![C](https://img.shields.io/badge/C-A8B9CC?style=flat&logo=c&logoColor=black)
![C++](https://img.shields.io/badge/C%2B%2B-00599C?style=flat&logo=cplusplus&logoColor=white)
![ARM Cortex-M](https://img.shields.io/badge/ARM%20Cortex--M-0091BD?style=flat&logo=arm&logoColor=white)
![RISC-V](https://img.shields.io/badge/RISC--V-283272?style=flat&logo=riscv&logoColor=white)
![STM32](https://img.shields.io/badge/STM32-03234B?style=flat&logo=stmicroelectronics&logoColor=white)
![FreeRTOS](https://img.shields.io/badge/FreeRTOS-0EA5E9?style=flat)
![Zephyr](https://img.shields.io/badge/Zephyr-0284C7?style=flat)
![Embedded Linux](https://img.shields.io/badge/Embedded%20Linux-FCC624?style=flat&logo=linux&logoColor=black)
![ROS 2](https://img.shields.io/badge/ROS%202-22314E?style=flat&logo=ros&logoColor=white)
![Keil MDK](https://img.shields.io/badge/Keil%20MDK-0071BC?style=flat)
![EasyEDA](https://img.shields.io/badge/EasyEDA-1B7CED?style=flat&logo=easyeda&logoColor=white)

**Applied AI**

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat&logo=langchain&logoColor=white)
![RAG](https://img.shields.io/badge/RAG-0F172A?style=flat)
![Vector Search](https://img.shields.io/badge/Vector%20Search-2563EB?style=flat)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat&logo=pytorch&logoColor=white)
![Hugging Face](https://img.shields.io/badge/Hugging%20Face-FFD21E?style=flat&logo=huggingface&logoColor=black)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=flat&logo=opencv&logoColor=white)

**Backend & Tooling**

![Java](https://img.shields.io/badge/Java-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=flat&logo=springboot&logoColor=white)
![Vue 3](https://img.shields.io/badge/Vue%203-4FC08D?style=flat&logo=vuedotjs&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat&logo=linux&logoColor=black)
![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white)
![Bash](https://img.shields.io/badge/Bash-4EAA25?style=flat&logo=gnubash&logoColor=white)

---

## Current Focus

Right now I'm going deeper on the parts of the stack that decide whether a system still behaves outside a demo:

- ⚙️ **RTOS architecture** — task scheduling, priority design, and memory budgets that hold under load.
- 🔍 **RAG evaluation** — retrieval quality and answer grounding, measured instead of assumed.
- 🤖 **ROS 2** — nodes and control loops for robotics experiments.
- 🧠 **Applied AI** — connecting models, tools, and APIs into workflows people can actually use.

Every project is built to run, not just to demo.

---

## 🏗️ Highlighted Projects

### Dual-Axis Stepper Motion Control
> STM32F103 firmware that keeps two stepper axes in lockstep: a `Sync_CalcParams` algorithm scales velocity and acceleration by step count, an integer-only AVR446 profile handles the trapezoidal ramp, and a Python host visualizes the resulting trajectory.
>
> 👉 [View Project](https://github.com/Ashleycurry/sync-calc-params-motion-control)
>
> *Two axes, one motion profile, no floating point.*

---

### STM32F407 Smart Timer Power Controller
> A four-state controller for scheduled load switching: keypad and UART configuration, MM.SS display, relay and alarm sequencing, plus a temperature-driven fail-safe. No RTOS, no DMA — all business logic runs on a 1 ms SysTick task table, so every tick is reproducible.
>
> 👉 [View Project](https://github.com/Ashleycurry/stm32f407-smart-timer-power-controller)
>
> *Predictable by construction, from the first tick to the last.*

---

### STM32 Grayscale Trace Car
> An eight-channel grayscale line follower: CD4051 multiplexing and ADC sampling produce a weighted position error, a PID loop steers an MG995 servo, and an L298N sets rear-wheel speed at a 200 Hz control rate.
>
> 👉 [View Project](https://github.com/Ashleycurry/stm32-grayscale-trace-car)
>
> *A complete sense → decide → actuate loop on one Cortex-M3.*

---

## 📝 I Document Everything

I keep long-form engineering notes on what I build with: embedded C and STM32, Linux and shell, Java backend development, and AI foundations. They're written to be re-read, not just published.

👉 [Read the notes at xiaogao-code.space](https://xiaogao-code.space)

---

## 🤝 Let's Connect

I'm open to embedded software and applied AI roles, and always up for a conversation about firmware, retrieval, or tooling.

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/Ashleycurry)
[![Blog](https://img.shields.io/badge/Blog-0EA5E9?style=flat&logo=hexo&logoColor=white)](https://xiaogao-code.space)

---

*Build close to the machine. Bring intelligence to the edge.*

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:BAE6FD,50:38BDF8,100:0EA5E9&height=110&width=640&section=footer&animation=fadeIn" width="640" alt="Sky blue animated footer" />
</p>
