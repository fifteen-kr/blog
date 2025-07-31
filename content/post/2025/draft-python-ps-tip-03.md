---
draft: true
title: "파이썬 PS 팁 #3: dict와 set"
date: 2025-08-08
tags: [ps, python]
---


## `dict`

## `set`

### `frozenset`

### 팁: 비트마스킹

만약 저장하려는 원소의 종류가 수십 가지 정도로 적다면, `set`이나 `frozenset` 대신 정수를 이용해 원소의 집합을 표현할 수 있습니다.

## `collections`

파이썬의 `collections` 모듈에는 다양한 데이터 구조가 있는데, 그 중 PS에 유용한 것들을 설명하겠습니다.

### `collections.deque`

"Deque"란 "double-ended queue"를 뜻합니다.

한편, 파이썬을 막 사용하기 시작한 사람들이 자주 저지르는 실수가 하나 있습니다. 큐를 구현해야 할 때, 이 클래스 대신 `queue` 모듈의 클래스들을 사용하는 것이죠.
하지만 `queue` 모듈에서 말하고 있는 "큐"는 멀티스레드 프로그램에서 쓰이는 큐를 뜻하기 때문에, 내부에서 락 처리를 하는 등 `collections.deque`보다 훨씬 무겁습니다.
즉, PS 문제를 풀 때에는 `queue` 모듈 사용은 되도록이면 자제하고, `collections.deque`나 `heapq`(우선 순위 큐의 경우)를 사용해야 합니다.

### `collections.Counter`

### `collections.defaultdict`

## `heapq`

