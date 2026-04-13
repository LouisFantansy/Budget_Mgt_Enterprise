import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  /**
   * 创建组织
   */
  async create(createOrgDto: Partial<Organization>): Promise<Organization> {
    const org = this.organizationRepository.create(createOrgDto);
    return await this.organizationRepository.save(org);
  }

  /**
   * 查询所有组织
   */
  async findAll(): Promise<Organization[]> {
    return await this.organizationRepository.find({
      relations: ['parent', 'children', 'manager'],
      order: { orgLevel: 'ASC', code: 'ASC' },
    });
  }

  /**
   * 查询组织树
   */
  async findTree(): Promise<Organization[]> {
    const roots = await this.organizationRepository.find({
      where: { parentId: null as any },
      relations: ['children', 'children.children', 'manager'],
      order: { orgLevel: 'ASC', code: 'ASC' },
    });
    return roots;
  }

  /**
   * 根据ID查询组织
   */
  async findOne(id: string): Promise<Organization> {
    const org = await this.organizationRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'manager'],
    });
    if (!org) {
      throw new NotFoundException(`组织 ${id} 不存在`);
    }
    return org;
  }

  /**
   * 根据层级查询组织
   */
  async findByLevel(level: number): Promise<Organization[]> {
    return await this.organizationRepository.find({
      where: { orgLevel: level },
      relations: ['parent', 'manager'],
      order: { code: 'ASC' },
    });
  }

  /**
   * 更新组织
   */
  async update(
    id: string,
    updateOrgDto: Partial<Organization>,
  ): Promise<Organization> {
    const org = await this.findOne(id);
    Object.assign(org, updateOrgDto);
    return await this.organizationRepository.save(org);
  }

  /**
   * 删除组织
   */
  async remove(id: string): Promise<void> {
    const org = await this.findOne(id);
    await this.organizationRepository.remove(org);
  }

  /**
   * 查询子组织
   */
  async findChildren(parentId: string): Promise<Organization[]> {
    return await this.organizationRepository.find({
      where: { parentId },
      relations: ['children', 'manager'],
      order: { code: 'ASC' },
    });
  }
}
