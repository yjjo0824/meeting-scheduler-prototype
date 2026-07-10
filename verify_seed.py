# -*- coding: utf-8 -*-
"""정답지 테스트: seed.json을 읽어 엔진이 반드시 재현해야 하는 결과를 검증한다.
구현된 트레이드오프 엔진은 이 스크립트와 동일한 결과를 내야 한다(완료 조건).
실행: python3 verify_seed.py  →  마지막 줄에 'ALL CHECKS PASSED'가 나와야 한다.
규칙 출처: SPEC.md §3 (R1 양보 비용 서열, R7 미응답 디폴트). 규칙 변경은 SPEC 수정 선행.
"""
import json, sys, itertools
from pathlib import Path

# 윈도우/맥 콘솔 호환: 윈도우 cp949 콘솔에서도 한글 출력이 깨지지 않도록 UTF-8로 재설정.
# 맥/리눅스에서는 이미 UTF-8이라 아무 영향 없음.
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

with open(Path(__file__).with_name('seed.json'), encoding='utf-8') as f:
    seed = json.load(f)

DAYS = seed['grid']['days']
HOURS = seed['grid']['hours']
SLOTS = [(d, h) for d in DAYS for h in HOURS]

def expand(chip):
    days = DAYS if chip['day'] == '*' else [chip['day']]
    return {(d, h) for d in days for h in chip['hours']}

hard, soft, flexible, attendance = {}, {}, {}, {}
for p in seed['people']:
    pid = p['id']
    attendance[pid] = p['attendance']
    hard[pid] = {(ev['day'], h) for ev in p['calendar'] for h in ev['hours']}
    soft[pid] = set()
    flexible[pid] = set()
    for chip in p['response'].get('chips', []):
        s = expand(chip)
        if chip['type'] == '불가':
            hard[pid] |= s
        elif chip['type'] == '회피':
            soft[pid] |= s
        elif chip['type'] == '병합':
            assert s <= hard[pid], f"병합 칩 오류: {pid} {chip} — 캘린더에 없는 슬롯"
        elif chip['type'] == '조정가능':
            assert s <= hard[pid], f"조정가능 칩 오류: {pid} {chip} — 하드 제약이 아님"
            flexible[pid] |= s

required = [p for p in hard if attendance[p] == 'required']
optional = [p for p in hard if attendance[p] == 'optional']
ALL = required + optional

def hard_blockers(slot, group, H):
    return [p for p in group if slot in H[p]]

def soft_violators(slot, group, S):
    return [p for p in group if slot in S[p]]

def perfect(H, S, group):
    return sorted([s for s in SLOTS if not hard_blockers(s, group, H) and not soft_violators(s, group, S)],
                  key=lambda s: (DAYS.index(s[0]), s[1]))

fails = []
def check(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL '), name, detail if not cond else '')
    if not cond:
        fails.append(name)

exp = seed['expected']
w = seed['cost_weights']

# ---- 기본 계산 (전원 응답 후) ----
check('총 슬롯 수', len(SLOTS) == exp['total_slots'])
check('완벽 슬롯 없음', perfect(hard, soft, ALL) == [])

all_attend = [s for s in SLOTS if not hard_blockers(s, ALL, hard)]
exp_aa = [(e['day'], e['hour']) for e in exp['all_attend_slots']]
check('전원 참석 슬롯', all_attend == exp_aa, f'실제: {all_attend}')
for e in exp['all_attend_slots']:
    sv = soft_violators((e['day'], e['hour']), ALL, soft)
    check(f"  소프트 위반자 {e['day']}{e['hour']}", sv == e['soft_violations'], f'실제: {sv}')

# ---- 선택 참석자 제외 후보 ----
for pid, key in [('doyun', 'candidates_exclude_doyun'), ('sua', 'candidates_exclude_sua')]:
    grp = [p for p in ALL if p != pid]
    cands = perfect(hard, soft, grp)
    expected = [(e['day'], e['hour']) for e in exp[key]]
    check(f'{pid} 제외 후보', cands == expected, f'실제: {cands}')

sole_sua = [s for s in SLOTS if hard_blockers(s, ALL, hard) == ['sua']]
check('수아 단독 차단 슬롯 없음', sole_sua == [])

# ---- 미응답 상태 (R7 디폴트: 캘린더 확정 일정만, 선호 없음) ----
doyun_cal = {(ev['day'], h) for p in seed['people'] if p['id'] == 'doyun'
             for ev in p['calendar'] for h in ev['hours']}
hard_pre = dict(hard); hard_pre['doyun'] = doyun_cal
soft_pre = dict(soft); soft_pre['doyun'] = set()
pre = perfect(hard_pre, soft_pre, ALL)
expected_pre = [(e['day'], e['hour']) for e in exp['pre_doyun_tentative_perfect']]
check('응답 전 잠정 완벽 슬롯', pre == expected_pre, f'실제: {pre}')
rec_pre = exp['recommendation_pre_doyun']
check('응답 전 잠정 추천', pre[0] == (rec_pre['day'], rec_pre['hour']))

# ---- 후보 생성: 최소 제외 집합 통합 규칙 (R1 일반화) ----
# 후보 슬롯 = 필수 참석자 전원이 하드 프리인 슬롯.
# 제외 집합 = 그 슬롯을 하드 차단하는 선택 참석자들(계산으로 유일하게 결정).
# 비용 = |제외| × optional_attendance + 남는 참석자의 선호 위반(사람 단위) 가중 합.
# 가중치 불변식: 선호 회피 목적의 자발적 제외가 이득이 되지 않아야 한다.
assert w['optional_attendance'] > w['optional_preference'], "가중치 불변식 위반: optional_attendance > optional_preference"

candidates = []
for s in SLOTS:
    if hard_blockers(s, required, hard):
        continue  # 필수 참석자 차단 = 양보 불가(R1)
    excluded = tuple(p for p in optional if s in hard[p])
    attendees = [p for p in ALL if p not in excluded]
    viol = tuple(p for p in attendees if s in soft[p])
    cost = len(excluded) * w['optional_attendance'] + sum(
        w['required_preference'] if attendance[p] == 'required' else w['optional_preference'] for p in viol)
    candidates.append({'slot': s, 'cost': cost, 'excluded': excluded, 'pref_unmet': viol,
                       'group_key': (excluded, viol)})
candidates.sort(key=lambda c: (c['cost'], DAYS.index(c['slot'][0]), c['slot'][1]))

# ---- 랭킹 체크 (R1: 양보 비용 오름차순 → 이른 날짜·시간) ----
top, alt = exp['recommendation_post']['top'], exp['recommendation_post']['alternative']
check('추천 1안', candidates[0]['slot'] == (top['day'], top['hour']) and candidates[0]['cost'] == top['cost'],
      f"실제: {candidates[0]}")
alts = [c for c in candidates if c['group_key'] != candidates[0]['group_key']]
check('대안(다른 포기 내용)', bool(alts) and alts[0]['slot'] == (alt['day'], alt['hour']) and alts[0]['cost'] == alt['cost'],
      f"실제: {alts[0] if alts else None}")
check('상위 두 후보의 포기 내용이 다름', candidates[0]['group_key'] != alts[0]['group_key'])

# ---- 후보군 그룹핑 (그룹 키 = 제외 집합 × 선호 미반영 사람 집합, 표시 레이어 규칙) ----
groups = []
for c in candidates:  # candidates가 이미 (비용, 이른 시간) 정렬 → 그룹 순서·기본 선택이 자동 유도됨
    g = next((g for g in groups if g['key'] == c['group_key']), None)
    if g is None:
        g = {'key': c['group_key'], 'cost': c['cost'], 'slots': []}
        groups.append(g)
    assert g['cost'] == c['cost'], f"그룹 내 비용 불일치: {c}"  # 그룹 키가 같으면 비용 동일(불변식)
    g['slots'].append(c['slot'])

exp_groups = exp['candidate_groups_post']
check('후보군 개수', len(groups) == len(exp_groups), f'실제: {len(groups)}')
for i, eg in enumerate(exp_groups):
    g = groups[i]
    slots_ok = g['slots'] == [(s['day'], s['hour']) for s in eg['slots']]
    key_ok = (set(g['key'][0]) == set(eg['excluded']) and set(g['key'][1]) == set(eg['pref_unmet']))
    default_ok = g['slots'][0] == (eg['default_slot']['day'], eg['default_slot']['hour'])
    check(f"  후보군 {eg['rank']} (제외 {eg['excluded'] or '없음'})",
          slots_ok and key_ok and default_ok and g['cost'] == eg['cost'],
          f"실제: {g}")

# ---- 날짜 필드 검증 (schedule_display는 표시 전용 — 위 계산 어디에도 쓰이지 않음) ----
from datetime import date
sd = seed['schedule_display']
start = date.fromisoformat(sd['window_start_date'])
deadline = date.fromisoformat(sd['response_deadline_date'])
check('window 시작일은 월요일', start.weekday() == 0, f'실제 요일 index: {start.weekday()}')
check('응답 데드라인 < window 시작', deadline < start, f'{deadline} vs {start}')

# ---- 탈출구 3종 ----
h2 = {p: set(v) for p, v in hard.items()}; h2['haneul'] -= flexible['haneul']
r = exp['escapes'][0]['result']
check('탈출구1 (하늘 금14 조정)', (r['day'], r['hour']) in perfect(h2, soft, ALL))

h3 = {p: set(v) for p, v in hard.items()}
h3['doyun'] = {s for s in h3['doyun'] if not (s[0] == '수' and s[1] in [14, 15, 16, 17])}
r = exp['escapes'][1]['result']
check('탈출구2 (도윤 수요일 오후 제거)', (r['day'], r['hour']) in perfect(h3, soft, ALL))

s2 = dict(soft); s2['seoyeon'] = set()
r = exp['escapes'][2]['result']
check('탈출구3 (서연 13시 회피 해제)', perfect(hard, s2, ALL) == [(r['day'], r['hour'])])

print()
if fails:
    print(f'FAILED: {len(fails)}건 —', fails); sys.exit(1)
print('ALL CHECKS PASSED — 엔진 구현은 이 결과를 재현해야 한다')
