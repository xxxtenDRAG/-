name: Feature
description: 新功能需求
title: "[Feature] "
labels: ["feature"]
body:
  - type: textarea
    id: goal
    attributes:
      label: 目标
      description: 要实现什么功能？解决什么问题？
    validations:
      required: true
  - type: textarea
    id: acceptance
    attributes:
      label: 验收标准
      description: 如何判断这个功能完成了？
    validations:
      required: true
  - type: dropdown
    id: contract-change
    attributes:
      label: 涉及契约变更
      options: ["无", "有（需先提 contracts PR）"]
    validations:
      required: true
  - type: input
    id: estimate
    attributes:
      label: 预计工时
      placeholder: 如 2 天
