import test from 'node:test'
import assert from 'node:assert/strict'
import { nextCameraDistance } from '../src/camera.js'

test('zoom buttons preserve direction after independent wheel zoom', () => {
  for (const distance of [4.8, 5, 6.3, 7.8, 9.4, 12]) {
    assert.ok(nextCameraDistance(distance, 1) <= distance)
    assert.ok(nextCameraDistance(distance, -1) >= distance)
  }
})

test('camera stays inside the orbit controls limits', () => {
  assert.equal(nextCameraDistance(5, 100), 4.8)
  assert.equal(nextCameraDistance(11.5, -100), 12)
  assert.equal(nextCameraDistance(7.8, 0), 7.8)
})
