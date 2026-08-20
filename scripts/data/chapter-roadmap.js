const CHAPTER_ROADMAP = [
  { id: 'multiplication', label: '증가와 곱셈', status: 'implemented' },
  { id: 'square', label: '제곱', status: 'prototype' },
  { id: 'tetration', label: '테트레이션', status: 'prototype' },
  { id: 'pentation', label: '펜테이션', status: 'planned' },
  { id: 'hexation', label: '헥세이션', status: 'planned' },
  { id: 'hyper-operation', label: '하이퍼 연산', status: 'planned' },
  { id: 'graham', label: '그레이엄수', status: 'planned' },
  { id: 'tree', label: 'TREE', status: 'planned' },
  { id: 'sscg', label: 'SSCG', status: 'planned' },
  { id: 'busy-beaver', label: 'BB', status: 'planned' },
  { id: 'rayo', label: '라요수', status: 'planned' }
];

function chapterLabelFor(id) {
  if (id === 'square-breakthrough') return '제곱돌파';
  if (id === 'square-convergence') return '제곱 수렴';
  return CHAPTER_ROADMAP.find(chapter => chapter.id === id)?.label ?? id;
}
