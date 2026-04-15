import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IpdProject } from '../entities/ipd-project.entity';

@Injectable()
export class IpdProjectService {
  constructor(
    @InjectRepository(IpdProject)
    private projectRepository: Repository<IpdProject>,
  ) {}

  async create(createDto: Partial<IpdProject>): Promise<IpdProject> {
    const project = this.projectRepository.create(createDto);
    return await this.projectRepository.save(project);
  }

  async findAll(): Promise<IpdProject[]> {
    return await this.projectRepository.find({
      relations: ['parent', 'children'],
      order: { projectCode: 'ASC' },
    });
  }

  async findTree(): Promise<IpdProject[]> {
    return await this.projectRepository.find({
      where: { parentId: null as any },
      relations: ['children', 'children.children'],
      order: { projectCode: 'ASC' },
    });
  }

  async findOne(id: string): Promise<IpdProject> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }
    return project;
  }

  async findByStatus(status: string): Promise<IpdProject[]> {
    return await this.projectRepository.find({
      where: { status },
      order: { projectCode: 'ASC' },
    });
  }

  async update(
    id: string,
    updateDto: Partial<IpdProject>,
  ): Promise<IpdProject> {
    const project = await this.findOne(id);
    Object.assign(project, updateDto);
    return await this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }
}
