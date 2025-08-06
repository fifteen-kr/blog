---
draft: true
title: "PS용 파이썬 성능 최적화 #2: 기본"
date: 2025-08-01
tags: [ps, python, optimization]
---

## 개요

이 시리즈는 프로그래밍 문제를 CPython으로 풀 때 어떻게 실행 시간을 최적화할 수 있는지를 다룹니다.
이번 글에서는 기본적인 팁과, 입출력 시간을 최적화하는 방법에 대해 알아봅시다.

## 최대한 CPython에 일 떠 넘기기

이게 CPython 코드 최적화의 알파이자 오메가입니다.

### "뻔한" 예시

## 가비지 컬렉터 끄기

사실 *메모리 사용량을 중시하더라도*, 대부분의 프로그래밍 문제 풀이에서 순환 참조는 일어나지 않기 때문에 가비지 컬렉션은 쓸모가 없습니다. 웬만해서는 꺼 놓는 것이 좋습니다.

```py
import gc; gc.disable()
```

## 빠른 입출력

입출력이 많은 경우, `input`을 사용하는 것보다 `sys.stdin.readline`을 사용하는 것이 더 효율적입니다.

[이건 상당히 잘 알려진 팁입니다.](https://www.acmicpc.net/problem/15552)

```py
import sys; input = sys.stdin.readline

for _ in range(int(input())):
    x, y = map(int, input().split())
    print(x+y)
```

- 위 링크에도 나와 있듯이, `sys.stdin.readline`은 개행 문자를 포함해서 반환하므로, 문자열 입력을 받는 경우 `.rstrip()`을 호출해야 할 수도 있습니다.

그런데, 이게 유일한 방법이 아니라는 사실, 알고 있나요?

같은 문제를 푸는데도 이렇게도 입출력을 받을 수 있고 (`0`은 `stdin`의 정수 file descriptor),

```py
_, *v = open(0)
for line in v:
    x, y = map(int, line.split())
    print(x+y)
```

이렇게도 입출력을 받을 수 있습니다.

```py
import sys

next(it := iter(sys.stdin))
for line in it:
    x, y = map(int, line.split())
    print(x+y)
```

이 두 코드가 보통 `sys.stdin.readline`을 사용하는 코드보다 약간 더 빠르지만, 입력 형식에 따라 사용할 수 없는 경우가 꽤 있죠.

`open(0)`을 이용한 입력은 파이썬 숏코딩에 매우 자주 사용되는, 알아두면 유용한 지식입니다.

`sys.stdin` 대신 `sys.stdin.buffer`, `open(0)` 대신 `open(0, mode='rb')`를 사용해 `str` 대신 `bytes`를 입력으로 받게 할 수도 있습니다. 다만 이렇게 바꾸면, 성능 향상이 큰 경우도 있지만, 예상치 못하게 성능이 약간 나빠지는 경우도 있습니다. 정확한 이유는 모르겠네요....

[^2]: 놀랍게도 `-O`, `-OO` 플래그가 [있습니다](https://docs.python.org/3/using/cmdline.html#cmdoption-O). 이것들로 활성화되는 최적화라고는 "`assert` 제거", "docstring 제거"와 같이 너무나도 사소한 최적화밖에 없지만요....
[^3]: 파이썬에 [JIT](https://peps.python.org/pep-0744/)이 기본으로 활성화되면 달라질 수도 있습니다만, 불행히도 아직은 아닙니다.
