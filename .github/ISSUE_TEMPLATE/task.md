name: Task
description: 子任务（不写代码的工作，如写文档/录视频）
title: "[Task] "
labels: ["task"]
body:
  - type: textarea
    id: goal
    attributes:
      label: 任务内容
    validations:
      required: true
  - type: textarea
    id: acceptance
    attributes:
      label: 完成标准
    validations:
      required: true
  - type: input
    id: estimate
    attributes:
      label: 预计工时
