---
draft: true
title: "PS용 파이썬 성능 최적화 #1: 프로파일링"
date: 2025-08-01
tags: [ps, python, optimization]
---

## 개요

이 시리즈는 프로그래밍 문제를 CPython으로 풀 때 실행 시간을 최적화하는 방법에 대해 다룹니다.[^1]

파이썬 코드를 실행할 때, 인터프리터 방식의 CPython보다 JIT 컴파일을 지원하는 PyPy를 사용하는 것이 훨씬 더 빠릅니다.
그렇기에 PS를 하는 대다수의 사람은 PyPy를 구현체로 이용합니다.
하지만 이 시리즈에서는 CPython만을 다루겠습니다. 제가 거의 CPython만 쓰기 때문입니다.[^2]

CPython으로 실행 시간을 줄이기 위해 노력하다 보면, 더 빠른 CPython 코드를 작성하는 방법은 생각보다 훨씬 까다롭다는 사실을 배우게 됩니다.
그 양은 블로그 글 하나로는 다 담을 수 없을 정도로 방대해서, 이 글에서는 파이썬 코드를 프로파일링 하는 방법에 대해 다루고, 다음 글부터는 기초적인 팁과 빠른 입출력에 대한 내용부터 다루어 보려고 합니다.

## 프로파일링 하기

실행 시간을 줄이기 위해 최적화를 할 때에는, 감으로 찍거나 원인/결과를 막연히 예상해서는 안 됩니다. 프로그램의 성능에 영향을 줄 수 있는 요소가 매우 많기 때문입니다.

이 시리즈에서 다룰 팁조차, 사실 "일반적으로는 이렇다~" 정도의 내용이여서, 실제로 적용했을 때 실행 시간이 줄어들 거라고 보장할 수 없습니다.

또한, 실제로 실행 시간이 줄어들더라도, 애초에 최적화를 진행한 부분의 원래 실행 시간이 짧았다면, 총 실행 시간이 들인 노력에 비해 그다지 줄어들지 않게 됩니다.
([암달의 법칙](https://en.wikipedia.org/wiki/Amdahl%27s_law)으로 알려져 있죠.)

따라서, 실제로 프로파일링을 해서 어느 부분을 개선해야 실행 시간을 제일 효율적으로 줄일 수 있는지, 그리고 최적화를 진행한 이후 정말로 실행 시간이 개선되었는지 검증하는 것이 매우 중요합니다.

그렇다면, 파이썬 코드의 실행 시간은 어떻게 측정할 수 있을까요? "바람직하지는 않지만 간단한 방법"부터 살펴 봅시다.

### `time`

제일 간단한 방법으로는 `time` 모듈을 `for` 루프와 함께 사용하는 것입니다.

```py
# 벤치마크 할 함수
arr = list(range(1_000_000))

def add_1():
    total = 0
    for x in arr: total += x
    return total

def add_2():
    return sum(arr)

# 실행 시간 측정
from time import time

for func in [add_1, add_2]:
    t_start = time()
    for _ in range(100): func()
    t_end = time()

    print(f"{func.__name__}:", t_end - t_start)
```

이 방법의 장점은, 무엇보다 세팅이 간단하다는 점입니다.
실행 시간을 측정하고 싶은 코드 앞에 `t_start = time()`, 뒤에 `t_end = time(); print(t_end - t_start)`만 적으면 되니까요.

하지만 이 간단한 방식에는 많은 문제들이 도사리고 있습니다.

- 가비지 컬렉션이 시간에 불규칙적인 영향을 줄 수 있습니다.
  - `import gc; gc.disable()`로 끄면 됩니다.
  - 다음 글에서 다시 언급하겠지만, 가비지 컬렉터는 항상 꺼 놓으면 됩니다.
- 실행 시간을 측정할 때, 여러 가지 외부 요인으로 인해 편차가 발생할 수 있습니다.
  - 다른 프로세스가 CPU를 잡아먹고 있다던가, 예상치 못한 디스크 I/O 병목이 생긴다던가, ...
  - 같은 코드를 같은 조건에서 실행해도, 이러한 이유들로 인해 5% 정도의 오차가 발생할 수 있습니다.
- 실행 시간이 짧은 코드를 여러 번 돌릴 때, 여러 번 돌리기 위한 루프의 오버헤드가 클 수 있습니다.
- `time.time()`은 사실 실행 시간을 측정할 때 부적절합니다.
  - 윤초 등의 영향을 받을 수 있습니다.
  - 시스템 시간이 변경되면, 그 영향을 받을 수 있습니다.
  - 초 단위 미만의 정밀도로 제공되지 않을 수 있습니다.[^3]

즉, 단순히 실행 시간의 근사치를 얻는 것 이상으로, 구체적으로 두 함수의 실행 시간을 비교한다거나 하는 목적으로는 적합하지 않을 수 있습니다.

다행히도, 파이썬에서는 더 장확한 프로파일링을 위한 모듈을 제공하고 있습니다.

### `timeit`

`timeit` 모듈은

[파이썬 문서에](https://docs.python.org/3/library/timeit.html) 다음과 같이 설명되어 있습니다.

> It avoids a number of common traps for measuring execution times.
>
> 이 모듈은 실행 시간을 측정할 때 빠지기 쉬운 함정을 피합니다.

이 방식의 한 가지 큰 문제는, 코드의 전체 실행 시간만을 측정할 수 있을 뿐, 구체적으로 어떤 요소가 시간을 제일 잡아먹는지 쉽게 측정할 수 없다는 점입니다.

### `cProfile`

아떤 함수를 최적화해야 큰 효과를 볼 수 있는지 알려면, 어떤 함수의 실행 시간이 오래 걸리는지를 파악해야 합니다.
파이썬에서는 이를 위해 `cProfile` 모듈을 제공합니다.

### `line_profiler`

<https://github.com/pyutils/line_profiler>

파이썬의 일부는 아니고, 서드 파티 라이브러리입니다.

한 가지 주의해야 할 점이 있습니다. 이 도구를 사용할 때의 오버헤드가 상당하기 때문에, 실행 시간을 측정하는 데에는 부정확하다는 것입니다.

## 벤치마크 유틸리티 코드

아래 코드는 제가 벤치마크를 하고자 할 때 사용하고자 작성한 유틸리티 코드입니다. 이 코드는 퍼블릭 도메인으로 공개합니다.

```py
"""
    Functions for micro-benchmarking.
"""

import timeit, statistics
from typing import Dict, List, Callable

def stdev_range(times: List[float]):
    return f"{statistics.mean(times):.3f} \xB1 {statistics.stdev(times):.3f} s"

def bench(stmts: List[Callable|str]|Callable|str, repeats_per_trial=1, num_trials=5, *, global_vars = None, log:bool = True) -> List[List[float]]|List[float]:
    is_list = isinstance(stmts, list)
    if not is_list: stmts = [stmts]

    times: List[List[float]] = [[] for _ in stmts]
    timers = [timeit.Timer(stmt, globals=(global_vars or globals())) for stmt in stmts]

    for _ in range(num_trials):
        for i, timer in enumerate(timers):
            times[i].append(timer.timeit(number=repeats_per_trial))
    
    if log:
        for stmt, time in zip(stmts, times):
            print(getattr(stmt, '__name__', None) or str(stmt), stdev_range(time))

    return times if is_list else times[0]
```

### 예시

```py
A = list(range(10_000_000))

def test_a():
    L = []
    for x in A: L.append(x)

def test_b():
    La = (L := []).append
    for x in A: La(x)

def test_c():
    L = []
    L.extend(A)

bench([test_a, test_b, test_c])
```

위 코드의 실행 결과는 다음과 같습니다.

```text
test_a 0.404 ± 0.026 s
test_b 0.426 ± 0.019 s
test_c 0.116 ± 0.008 s
```


[^1]: 실행 시간을 줄이는 것에 집중합니다. 메모리 사용량 등의 다른 요소는 다루지 않습니다.
[^2]: 여러 가지 이유가 있습니다. "이왕이면 최신 버전의 파이썬을 쓰고 싶다", "짧은 코드는 CPython에서 실행 시간이 더 빠르다", "CPython으로 통과시키는 게 재밌잖아", "PyPy 세팅이 귀찮아서", ...
[^3]: 뭐, 보통은 ms 단위까지는 충분히 제공해 주는데다, `time.time_ns()`를 쓰면 해결 가능한 문제이기 때문에 그다지 큰 문제는 아닙니다.