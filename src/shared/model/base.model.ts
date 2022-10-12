import Paginate from 'mongoose-paginate-v2'

import { ApiHideProperty } from '@nestjs/swagger'
import { modelOptions, plugin } from '@typegoose/typegoose'

// @plugin(mongooseLeanVirtuals)
// @plugin(LeanId)
@plugin(Paginate)
@modelOptions({
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: {
      createdAt: 'created',
      updatedAt: false,
    },
  },
})
export class BaseModel {
  @ApiHideProperty()
  created?: Date

  id?: string

  static get protectedKeys() {
    return ['created', 'id', '_id']
  }
}
