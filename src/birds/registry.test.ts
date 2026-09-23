import { BirdRegistry } from './registry'
import { buildBird } from './procedural'
import { getSpec } from './species'

describe('BirdRegistry', () => {
  it('assigns ids, exposes position from the model group, and looks up by species', () => {
    const reg = new BirdRegistry()
    const a = reg.add({ species: 'y00475', model: buildBird(getSpec('y00475')), behavior: 'swim' })
    const b = reg.add({ species: 'mallar3', variant: 'female', model: buildBird(getSpec('mallar3'), 'female'), behavior: 'swim' })
    expect(a.id).not.toBe(b.id)
    expect(a.identified).toBe(false)
    a.model.group.position.set(1, 2, 3)
    expect(a.position.x).toBe(1)
    expect(reg.bySpecies('mallar3')).toEqual([b])
    expect(reg.size).toBe(2)
    reg.remove(a.id)
    expect(reg.get(a.id)).toBeUndefined()
    expect(reg.all()).toEqual([b])
  })
})
