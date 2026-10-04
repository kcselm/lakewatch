import * as THREE from 'three'

export const BONE_NAMES = [
  'root', 'body', 'neck', 'neckMid', 'head', 'bill', 'tail',
  'wingL', 'wingR', 'wingFoldL', 'wingFoldR',
  'legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR',
  // version-only parts, one bone each (last, so no earlier bone's index moves)
  'curl',
  // a long neck's further joints, between neckMid and the head (after every earlier bone, so none of their indices moves)
  'neck3', 'neck4', 'neck5', 'neck6',
  // a version-only part that hangs from the head
  'plume',
  // a flight wing's outer half, from the wrist out (after every earlier bone)
  'handL', 'handR',
] as const
export type BoneName = (typeof BONE_NAMES)[number]

export const BONE_INDEX = Object.fromEntries(BONE_NAMES.map((n, i) => [n, i])) as Record<BoneName, number>

/** The neck's joints from its base, in order; the head joint follows the last. A neck of two joints uses the first two. */
export const NECK_BONES = ['neck', 'neckMid', 'neck3', 'neck4', 'neck5', 'neck6'] as const
export type NeckBone = (typeof NECK_BONES)[number]

/** The bones at a neck chain's labels, base to head: the first `labels - 1` neck joints, then the head. */
export function chainBones(labels: number): (NeckBone | 'head')[] {
  if (labels < 3 || labels > NECK_BONES.length + 1) throw new Error(`a neck chain has 3 to ${NECK_BONES.length + 1} labels, got ${labels}`)
  return [...NECK_BONES.slice(0, labels - 1), 'head']
}

/**
 * The legs hang from root, not body, so leaning the body (pecking, tip-ups) pivots it over the hips without
 * swinging the planted feet.
 */
export const BONE_PARENT: Record<BoneName, BoneName | null> = {
  root: null, body: 'root', neck: 'body', neckMid: 'neck', head: 'neck6', bill: 'head', tail: 'body',
  wingL: 'body', wingR: 'body', wingFoldL: 'body', wingFoldR: 'body',
  legs: 'root', tibiaL: 'legs', tarsusL: 'tibiaL', toesL: 'tarsusL', tibiaR: 'legs', tarsusR: 'tibiaR', toesR: 'tarsusR',
  curl: 'body',
  neck3: 'neckMid', neck4: 'neck3', neck5: 'neck4', neck6: 'neck5',
  plume: 'head',
  handL: 'wingL', handR: 'wingR',
}

export type Joints = Record<BoneName, THREE.Vector3>

/** Bones at the given group-space joints, parented per BONE_PARENT, in rest pose (no rotation). */
export function createBones(joints: Joints): { bones: Record<BoneName, THREE.Bone>; list: THREE.Bone[] } {
  const bones = {} as Record<BoneName, THREE.Bone>
  for (const name of BONE_NAMES) {
    const b = new THREE.Bone()
    b.name = name
    bones[name] = b
  }
  for (const name of BONE_NAMES) {
    const parent = BONE_PARENT[name]
    const b = bones[name]
    if (parent) {
      b.position.copy(joints[name]).sub(joints[parent])
      bones[parent].add(b)
    } else {
      b.position.copy(joints[name])
    }
  }
  return { bones, list: BONE_NAMES.map(n => bones[n]) }
}
