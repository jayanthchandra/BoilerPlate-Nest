import { compareSync } from 'bcrypt'
import { nanoid } from 'nanoid'
import { sleep } from 'zx-cjs'

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'

import { BizException } from '~/common/exceptions/business.exception'
import { ErrorCodeEnum } from '~/constants/error-code.constant'
import { CacheService } from '~/processors/cache/cache.service'
import { InjectModel } from '~/transformers/model.transformer'

import { AuthService } from '../auth/auth.service'
import { UserDocument , UserModel } from './user.model'

@Injectable()
export class UserService {
  private Logger = new Logger(UserService.name)
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: ReturnModelType<typeof UserModel>,
    private readonly authService: AuthService,
    private readonly redis: CacheService,
  ) {}
  public get model() {
    return this.userModel
  }
  async login(username: string, password: string) {
    const user = await this.userModel.findOne({ username }).select('+password')
    if (!user) {
      await sleep(3000)
      throw new ForbiddenException('Forbidden')
    }
    if (!compareSync(password, user.password)) {
      await sleep(3000)
      throw new ForbiddenException('Forbidden')
    }

    return user
  }

  async getMasterInfo(getLoginIp = false) {
    const user = await this.userModel
      .findOne()
      .select(`-authCode${getLoginIp ? ' +lastLoginIp' : ''}`)
      .lean({ virtuals: true })
    if (!user) {
      throw new BadRequestException('没有完成初始化!')
    }

    return { ...user }
  }
  async hasMaster() {
    return !!(await this.userModel.countDocuments())
  }

  public async getMaster() {
    const master = await this.userModel.findOne().lean()
    if (!master) {
      throw new BadRequestException('Forbidden')
    }
    return master
  }

  async createMaster(
    model: Pick<UserModel, 'username' | 'name' | 'password'> &
      Partial<Pick<UserModel, 'introduce' | 'avatar' | 'url'>>,
  ) {
    const hasMaster = await this.hasMaster()
    if (hasMaster) {
      throw new BadRequestException('Forbidden')
    }
    const authCode = nanoid(10)

    // @ts-ignore
    const res = await this.userModel.create({ ...model, authCode })
    const token = await this.authService.signToken(res._id)
    return { token, username: res.username, authCode: res.authCode }
  }


  async patchUserData(
    user: UserDocument,
    data: Partial<UserModel>,
  ): Promise<any> {
    const { password } = data
    const doc = { ...data }
    if (password !== undefined) {
      const { _id } = user
      const currentUser = await this.userModel
        .findById(_id)
        .select('+password +apiToken')

      if (!currentUser) {
        throw new BizException(ErrorCodeEnum.MasterLostError)
      }
      const isSamePassword = compareSync(password, currentUser.password)
      if (isSamePassword) {
        throw new UnprocessableEntityException('Forbidden')
      }

      const newCode = nanoid(10)
      doc.authCode = newCode
    }
    return await this.userModel
      .updateOne({ _id: user._id }, doc)
      .setOptions({ omitUndefined: true })
  }

  async recordFootstep(ip: string): Promise<Record<string, Date | string>> {
    const master = await this.userModel.findOne()
    if (!master) {
      throw new BizException(ErrorCodeEnum.MasterLostError)
    }
    const PrevFootstep = {
      lastLoginTime: master.lastLoginTime || new Date(1586090559569),
      lastLoginIp: master.lastLoginIp || null,
    }
    await master.updateOne({
      lastLoginTime: new Date(),
      lastLoginIp: ip,
    })

    this.Logger.warn(`IP, IP: ${ip}`)
    return PrevFootstep as any
  }
}
