import * as THREE from 'three'

export const BONE_NAMES = [
  'root', 'body', 'neck', 'neckMid', 'head', 'bill', 'tail',
  'wingL', 'wingR', 'wingFoldL', 'wingFoldR',
  'legs', 'tibiaL', 'tarsusL', 'toesL', 'tibiaR', 'tarsusR', 'toesR',
] as const
export type BoneName = (typeof BONE_NAMES)[number]

export const BONE_INDEX = Object.fromEntries(BONE_NAMES.map((n, i) => [n, i])) as Record<BoneName, number>

/**
 * The legs hang from root, not body, so leaning the body (pecking, tip-ups) pivots it over the hips without
 * swinging the planted feet.
 */
export const BONE_PARENT: Record<BoneName, BoneName | null> = {
  root: null, body: 'root', neck: 'body', neckMid: 'neck', head: 'neckMid', bill: 'head', tail: 'body',
  wingL: 'body', wingR: 'body', wingFoldL: 'body', wingFoldR: 'body',
  legs: 'root', tibiaL: 'legs', tarsusL: 'tibiaL', toesL: 'tarsusL', tibiaR: 'legs', tarsusR: 'tibiaR', toesR: 'tarsusR',
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
