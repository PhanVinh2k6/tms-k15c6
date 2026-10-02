import { Module } from '@nestjs/common';
import { ClassAssignmentLookup, NoClassAssignmentLookup } from './class-assignment';

/** Chỗ để module Lớp học (Sprint 3) cắm dữ liệu thật vào; hiện chưa có lớp nào nên luôn trả về rỗng. */
@Module({
  providers: [{ provide: ClassAssignmentLookup, useClass: NoClassAssignmentLookup }],
  exports: [ClassAssignmentLookup],
})
export class ClassAssignmentModule {}
