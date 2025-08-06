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

CPython으로 실행 시간을 줄이기 위해 노력하다 보면, 더 빠른 CPython 코드를 작성하는 방법은 생각보다 훨씬 까다롭다는 사실을 깨닫게 됩니다.
그 양은 블로그 글 하나로는 다 담을 수 없을 정도로 방대하죠.

이 글에서는 파이썬 코드를 프로파일링 하는 방법에 대해 다루고, 다음 글에선 기초적인 팁과 빠른 입출력에 대해 이야기 해 보려고 합니다.

## 프로파일링 하기

실행 시간을 줄이기 위해 최적화를 할 때에는, 감으로 찍거나 원인/결과를 막연히 예상해서는 안 됩니다. 프로그램의 성능에 영향을 줄 수 있는 요소가 매우 많기 때문입니다.

이 시리즈에서 다룰 팁조차, 사실 "일반적으로는 이렇다~" 정도의 내용이여서, 실제로 적용했을 때 실행 시간이 줄어들 거라고 보장할 수 없습니다.

또한, 실제로 실행 시간이 줄어들더라도, 애초에 최적화를 진행한 부분의 원래 실행 시간이 짧았다면, 총 실행 시간이 들인 노력에 비해 그다지 줄어들지 않게 됩니다.
([암달의 법칙](https://en.wikipedia.org/wiki/Amdahl%27s_law)으로 알려져 있죠.)

따라서, 실제로 프로파일링을 해서 어느 부분을 개선해야 실행 시간을 제일 효율적으로 줄일 수 있는지, 그리고 최적화를 진행한 이후 정말로 실행 시간이 개선되었는지 검증하는 것이 매우 중요합니다.

### `time`

`time` 모듈을 이용하면, 파이썬 코드의 실행 시간을 간단하게 측정할 수 있습니다.

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

하지만 이 간단한 방식에는 많은 함정들이 도사리고 있습니다.

- 가비지 컬렉션이 시간에 불규칙적인 영향을 줄 수 있습니다.
  - `import gc; gc.disable()`로 끄면 됩니다.
- 실행 시간을 측정할 때, 여러 가지 외부 요인으로 인해 편차가 발생할 수 있습니다.
  - 다른 프로세스가 CPU를 잡아먹고 있다던가, 예상치 못한 디스크 I/O 병목이 생긴다던가, ...
  - 같은 코드를 같은 조건에서 실행해도, 이러한 이유들로 인해 5% 정도의 오차가 발생할 수 있습니다.
- 실행 시간이 짧은 코드를 여러 번 돌릴 때, 여러 번 돌리기 위한 루프의 오버헤드가 클 수 있습니다.
- `time.time()`은 사실 실행 시간을 측정할 때 부적절합니다.
  - 윤초 등의 영향을 받을 수 있습니다.
  - 시스템 시간이 변경되면, 그 영향을 받을 수 있습니다.
  - 초 단위 미만의 정밀도로 제공되지 않을 수 있습니다.[^3]

이 중, 마지막 문제는 `time.time()` 대신 다른 함수를 사용해서 회피할 수 있습니다.

- `time.monotonic()`은 시스템 시간 영향 없이, 단조 증가하는 시각을 반환합니다.
- `time.perf_counter()`는 제일 정확도가 높은 시각을 반환하는데, CPython에서는 `time.monotonic()`과 같은 값을 반환합니다.
- `time.process_time()`는 CPython 프로세스가 CPU를 점유 중인 시간만을 반환합니다.

`time.monotonic()`, `time.perf_counter()`, `time.process_time()` 모두 기준이 되는 점이 명시되어 있지 않음에 주의해 주세요.
두 값의 차이만 의미를 가지며, 단일 값 그 자체로는 아무런 의미를 지니지 않습니다.

겉보기에는 `time.process_time()`가 더 좋아 보일 수도 있지만, 실행 시간 측정에는 `time.perf_counter()`를 쓰는 것이 더 적절합니다.
`time.process_time()`은 프로세스 실행이 컨텍스트 스위칭 등으로 멈춰 있을 때에는 동작하지 않는데, 그런 것들이 우리가 측정하고 싶은 코드의 성능의 일부로서 고려되어야 하기 때문입니다.

즉, `time`을 사용하여 정확하게 시간을 재려면, 다음과 같이 해야 합니다.

- `time.perf_counter()`, 혹은 `time.perf_counter_ns()`를 이용하여 시각을 측정한다.
- 테스트 할 코드가 실행 중일 때에는, 가비지 컬렉터를 끈다.[^4]
- 실행 시간 편차를 줄이기 위해, 여러 번 코드를 실행하고 평균, 표준편차 등을 활용한 통계적 분석을 한다.
- 실행 시간이 짧은 코드를 여러 번 돌릴 때, 오버헤드를 최소화해야 한다.

다행히도, 파이썬에서는 코드 실행 시간 측정을 위한 모듈을 제공해주고 있습니다.

### `timeit`

`timeit` 모듈은 파이썬 코드의 실행 시간을 측정할 때 도움이 되는 도구들을 모아 놓은, 파이썬에서 기본으로 제공해 주는 모듈들 중 하나입니다.

[파이썬 문서에](https://docs.python.org/3/library/timeit.html) 다음과 같이 설명되어 있습니다.

> It avoids a number of common traps for measuring execution times.
>
> 이 모듈은 실행 시간을 측정할 때 빠지기 쉬운 함정을 피합니다.

#### `timeit` 사용하기

제일 심플하게는, 터미널에서 직접 모듈을 호출할 수 있습니다.

```bash
python -m timeit "for _ in range(10**6): pass"
```

```txt
20 loops, best of 5: 10.3 msec per loop
```

코드에서 `timeit`을 임포트해서 직접 호출할 수도 있습니다.

```py
import timeit

# 0.010...
print(timeit.timeit("for _ in range(10**6): pass", number=1))
```

문자열 뿐만 아니라, 함수를 이용할 수도 있습니다.

```py
import timeit

def bench():
    for _ in range(10**6): pass

print(timeit.timeit(bench, number=1))
```

`timeit.Timer`를 사용해 더 유연한 벤치마킹 코드를 작성할 수도 있는데, 자세한 사항는 [관련 문서](https://docs.python.org/3/library/timeit.html#timeit.Timer)를 참고해 주세요.

#### `timeit` 작동 방식

`timeit`은 [파이썬으로 구현되어 있으며](https://github.com/python/cpython/blob/3.13/Lib/timeit.py), 내부적으로는 `time`을 사용합니다만, 위에서 언급한 함정들을 회피하고 있습니다. 

- 시간 측정 직전 `gc.disable()`를 호출합니다.
  - 물론, 기존에 GC를 사용하고 있었다면 시간 측정 이후 다시 활성화 해 주죠.
- 반복 측정을 위해, 한 번 시간 측정시 주어진 함수를 여러 번 돌리는 기능을 제공해 주고 있습니다.
  - `timeit.timeit`: `number`로 함수를 몇 번 돌릴지 정할 수 있습니다.
  - `timeit.repeat`: `repeat`로 측정 횟수를 정할 수 있습니다.[^5]
  - `timeit.Timer` 클래스에서 반복 횟수를 자동으로 정해 주는 `autorange()` 함수를 제공하고 있습니다.
- 반복 측정을 위해 루프를 돌릴 때, `for` 루프 직전에 측정을 시작하고, `for` 루프 직후에 측정을 끝냅니다.
  - `for` 루프 오버헤드도 `range` 대신 `itertools.repeat`를 통해 최소화하고 있습니다. 이 점에 대해서는 나중 글에서 다룰 예정입니다.
- 기본 타이머로 `time.perf_counter`를 사용합니다.

더 장확한 시간 측정을 위한 여러 팁들이 존재하지만, 이 글에서는 생략하겠습니다.[^6]

파이썬 코드의 실행 시간을 측정하는 데에는 `timeit`으로 충분합니다만, 실제로 최적화를 진행할 때 `timeit`만으로 부족할 때가 있습니다.
`timeit`은 코드의 전체 실행 시간만 측정할 수 있고, 노가다로 코드를 분해해 각각의 실행 시간을 측정하지 않는 이상, 구체적으로 코드의 어느 부분이 시간을 많이 잡아먹는지 알려주지는 않기 때문입니다.

다행히도, 파이썬에서는 코드 실행 시간 분석을 위한 모듈을 제공해주고 있습니다.

### `cProfile`

아떤 함수를 최적화해야 큰 효과를 볼 수 있는지 알려면, 어떤 함수의 실행 시간이 오래 걸리는지를 파악해야 합니다.
파이썬에서는 이를 위해 `cProfile` 모듈을 제공합니다.[^7]

```py
def func_1():
    return sum(range(10_000_000))

def func_2():
    return "".join(map(str, range(10_000_000)))

def func_3():
    return min(range(10_000_000))

def test():
    func_1()
    func_2()
    func_3()

test()
```

위와 같은 코드를 `test.py`로 저장한 뒤, 터미널에서 아래와 같이 `cProfile`을 실행하면...

```bash
python -m cProfile test.py
```

... 혹은, 다음과 같은 코드를 `test.py` 밑에 덧붙인 다음, `test.py`를 실행하면...[^8]

```py
import cProfile
cProfile.run("test()")
```

... 이렇게 결과가 출력됩니다.

```txt
         10 function calls in 1.493 seconds

   Ordered by: cumulative time

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.000    0.000    1.493    1.493 {built-in method builtins.exec}
        1    0.000    0.000    1.493    1.493 test.py:1(<module>)
        1    0.005    0.005    1.493    1.493 test.py:10(test)
        1    0.000    0.000    1.098    1.098 test.py:4(func_2)
        1    1.098    1.098    1.098    1.098 {method 'join' of 'str' objects}
        1    0.000    0.000    0.246    0.246 test.py:1(func_1)
        1    0.246    0.246    0.246    0.246 {built-in method builtins.sum}
        1    0.000    0.000    0.144    0.144 test.py:7(func_3)
        1    0.144    0.144    0.144    0.144 {built-in method builtins.min}
        1    0.000    0.000    0.000    0.000 {method 'disable' of '_lsprof.Profiler' objects}
```

각 열 별 설명은 다음과 같습니다.

- `ncalls`: 함수가 실행된 총 횟수입니다.
- `tottime`: 함수를 실행하는 데 걸린 시간에서, 함수에서 호출 된 함수들을 실행하는 시간을 뺀 시간입니다.
- `cumtime`: 함수를 실행하는 데 걸린 총 시간입니다. 함수에서 호출된 다른 함수들의 실행 시간을 포함합니다.
- `percall`: `tottime` 또는 `cumtime`을 호출 횟수 `ncalls`로 나눈 값입니다.

즉, 위의 예시 출력은 다음과 같이 해석할 수 있습니다.

- `func_1`, `func_2`, `func_3` 중, 제일 실행 시간이 오래 걸린 함수는 `func_2`입니다.
- `func_2` 자체적으로 소모한 시간은 없지만, `"".join`을 실행하는 데 모든 시간을 보내고 있습니다.

출력에도 적혀 있듯이, 기본적으로 `cProfile`은 `cumtime`이 감소하는 순으로 정렬해서 출력해 줍니다.

### `line_profiler`

<https://github.com/pyutils/line_profiler>

파이썬의 일부는 아니고, 서드 파티 라이브러리입니다.

한 가지 주의해야 할 점이 있습니다. 이 도구를 사용할 때의 오버헤드가 상당하기 때문에, 실행 시간을 측정하는 데에는 부정확하다는 것입니다.

## 벤치마크 유틸리티 코드

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

[^1]: 실행 시간을 줄이는 것에 집중합니다. 메모리 사용량 등의 다른 요소는 다루지 않습니다.
[^2]: 여러 가지 이유가 있습니다. "이왕이면 최신 버전의 파이썬을 쓰고 싶다", "짧은 코드는 CPython에서 실행 시간이 더 빠르다", "CPython으로 통과시키는 게 재밌잖아", "PyPy 세팅이 귀찮아서", 기타 등등...
[^3]: 뭐, 보통은 ms 단위까지는 충분히 제공해 주는데다, `time.time_ns()`를 쓰면 해결 가능한 문제이기 때문에 그다지 큰 문제는 아닙니다.
[^4]: 다음 글에서 다시 언급하겠지만, 가비지 컬렉터는 항상 꺼 놓아도 됩니다. 즉, 가비지 컬렉션이 코드 실행 시간에 영향을 주지 못한다고 가정해야 합니다.
[^5]: 파이썬 문서에서는 이렇게 반복해서 측정할 시, 최솟값을 제외한 값은 파이썬에 의한 시간 변동이 아닌, 외부 요인으로 인한 시간 변동에 더 큰 영향을 받기 때문에, 별 의미가 없다고 합니다.
평균이나 표준편차 같은 통계값을 보지 말고, 측정한 시간 값들을 직접 보고 "상식적"으로 판단하라고 하고 있죠.
근거 없는 말은 아닙니다만, 제가 보기에는 최솟값을 보기 보다는 컴퓨터가 안정화 된 상태에서 여러번 돌리고 통계값을 내는 것이 더 나아 보입니다. ([참고](https://news.ycombinator.com/item?id=22085172))
[^6]: [리눅스에서 `taskset`](https://vstinner.github.io/journey-to-stable-benchmark-system.html)을 (윈도우에서는 `cmd`에서 `start /affinity`를) 사용하면 더 안정적으로 시간 측정이 가능하다던가....
[^7]: `cProfile`을 사용함으로써 생기는 부하가 작기는 하지만, 그래도 부하가 없지는 않기 때문에 `cProfile`을 벤치마크 용도로 사용하는 건 부적절한 점에 주의해 주세요.
[^8]: 파이썬 IDLE 셸에선 부정확한 결과가 나올 수 있으니 조심해 주세요.