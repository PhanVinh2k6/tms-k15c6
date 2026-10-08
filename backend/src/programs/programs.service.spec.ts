import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClassRunningLookup } from './class-running';
import { ProgramStatus } from './program.types';
import { ProgramsService } from './programs.service';

class MockClassRunningLookup extends ClassRunningLookup {
  private runningProgramIds = new Set<string>();

  setRunning(programId: string, running: boolean) {
    if (running) {
      this.runningProgramIds.add(programId);
    } else {
      this.runningProgramIds.delete(programId);
    }
  }

  hasRunningClasses(programId: string): boolean {
    return this.runningProgramIds.has(programId);
  }
}

describe('ProgramsService - S2-04 Danh mục chương trình', () => {
  let service: ProgramsService;
  let runningLookup: MockClassRunningLookup;

  beforeEach(() => {
    runningLookup = new MockClassRunningLookup();
    service = new ProgramsService(runningLookup);
  });

  describe('create', () => {
    it('tạo chương trình đào tạo thành công với đầy đủ thông tin hợp lệ', () => {
      const result = service.create({
        code: 'PROG-AI01',
        name: 'Trí tuệ nhân tạo và Machine Learning',
        description: 'Khoá học AI căn bản',
        totalDuration: 120,
        standardTuition: 20000000,
        status: ProgramStatus.ACTIVE,
      });

      expect(result.id).toBeDefined();
      expect(result.code).toBe('PROG-AI01');
      expect(result.name).toBe('Trí tuệ nhân tạo và Machine Learning');
      expect(result.description).toBe('Khoá học AI căn bản');
      expect(result.totalDuration).toBe(120);
      expect(result.standardTuition).toBe(20000000);
      expect(result.status).toBe(ProgramStatus.ACTIVE);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('tự động chuẩn hoá mã chương trình sang chữ hoa', () => {
      const result = service.create({
        code: 'prog-ai02',
        name: 'Deep Learning',
        totalDuration: 80,
        standardTuition: 15000000,
      });

      expect(result.code).toBe('PROG-AI02');
      expect(result.status).toBe(ProgramStatus.ACTIVE);
      expect(result.description).toBeNull();
    });

    it('báo lỗi ConflictException khi mã chương trình đã tồn tại (không phân biệt chữ hoa/thường)', () => {
      expect(() =>
        service.create({
          code: 'prog-fe01', // Đã có PROG-FE01 trong seed data
          name: 'Trùng mã',
          totalDuration: 50,
          standardTuition: 10000000,
        }),
      ).toThrow(ConflictException);
    });
  });

  describe('list', () => {
    it('lấy danh sách chương trình có phân trang', () => {
      const result = service.list({ page: 1, pageSize: 2 });
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.items.length).toBe(2);
      expect(result.total).toBeGreaterThanOrEqual(3);
    });

    it('tìm kiếm theo từ khoá q (mã hoặc tên)', () => {
      const result = service.list({ page: 1, pageSize: 10, q: 'FE01' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].code).toBe('PROG-FE01');
    });

    it('lọc theo trạng thái chương trình', () => {
      const activeList = service.list({
        page: 1,
        pageSize: 10,
        status: ProgramStatus.ACTIVE,
      });
      expect(activeList.items.every((p) => p.status === ProgramStatus.ACTIVE)).toBe(true);

      const inactiveList = service.list({
        page: 1,
        pageSize: 10,
        status: ProgramStatus.INACTIVE,
      });
      expect(inactiveList.items.every((p) => p.status === ProgramStatus.INACTIVE)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('tìm thấy chương trình theo id', () => {
      const program = service.findOne('prog-1');
      expect(program).toBeDefined();
      expect(program.code).toBe('PROG-FE01');
    });

    it('ném lỗi NotFoundException khi id không tồn tại', () => {
      expect(() => service.findOne('invalid-id')).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('cập nhật thành công các trường thông tin', () => {
      const updated = service.update('prog-1', {
        name: 'Lập trình Frontend nâng cao',
        totalDuration: 80,
        standardTuition: 13000000,
        description: 'Mô tả mới',
      });

      expect(updated.name).toBe('Lập trình Frontend nâng cao');
      expect(updated.totalDuration).toBe(80);
      expect(updated.standardTuition).toBe(13000000);
      expect(updated.description).toBe('Mô tả mới');
    });

    it('cập nhật mã chương trình mới không bị trùng', () => {
      const updated = service.update('prog-1', {
        code: 'PROG-FE-NEW',
      });
      expect(updated.code).toBe('PROG-FE-NEW');
    });

    it('báo lỗi ConflictException khi cập nhật mã trùng với chương trình khác', () => {
      expect(() =>
        service.update('prog-1', {
          code: 'PROG-BE01', // Đã thuộc prog-2
        }),
      ).toThrow(ConflictException);
    });

    it('cho phép cập nhật mà giữ nguyên mã hiện tại của chính chương trình đó', () => {
      const updated = service.update('prog-1', {
        code: 'PROG-FE01',
        name: 'Giữ nguyên mã',
      });
      expect(updated.code).toBe('PROG-FE01');
      expect(updated.name).toBe('Giữ nguyên mã');
    });

    it('ném lỗi NotFoundException khi cập nhật chương trình không tồn tại', () => {
      expect(() =>
        service.update('non-existent', { name: 'Chương trình ảo' }),
      ).toThrow(NotFoundException);
    });
  });

  describe('deactivate & activate (Ngừng áp dụng & Áp dụng lại)', () => {
    it('ngừng áp dụng chương trình chuyển trạng thái sang INACTIVE', () => {
      const deactivated = service.deactivate('prog-1');
      expect(deactivated.status).toBe(ProgramStatus.INACTIVE);
    });

    it('áp dụng lại chương trình chuyển trạng thái sang ACTIVE', () => {
      const activated = service.activate('prog-3');
      expect(activated.status).toBe(ProgramStatus.ACTIVE);
    });
  });

  describe('remove (Xoá chương trình & ràng buộc lớp đang chạy)', () => {
    it('xoá thành công chương trình khi KHÔNG có lớp đang chạy', async () => {
      runningLookup.setRunning('prog-1', false);
      const res = await service.remove('prog-1');
      expect(res.id).toBe('prog-1');
      expect(() => service.findOne('prog-1')).toThrow(NotFoundException);
    });

    it('ném ConflictException khi chương trình ĐANG CÓ LỚP CHẠY', async () => {
      runningLookup.setRunning('prog-2', true);

      await expect(service.remove('prog-2')).rejects.toThrow(ConflictException);

      // Thử lại bằng cách kiểm tra error details
      try {
        await service.remove('prog-2');
        fail('Phải ném lỗi ConflictException');
      } catch (err: unknown) {
        const error = err as { getResponse: () => { code: string; message: string } };
        const response = error.getResponse();
        expect(response.code).toBe('PROGRAM_HAS_RUNNING_CLASSES');
        expect(response.message).toBe(
          'Chương trình đang có lớp chạy không được xoá, chỉ được ngừng áp dụng.',
        );
      }

      // Vẫn có thể ngừng áp dụng được khi có lớp đang chạy
      const deactivated = service.deactivate('prog-2');
      expect(deactivated.status).toBe(ProgramStatus.INACTIVE);
    });

    it('ném NotFoundException khi xoá chương trình không tồn tại', async () => {
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkCode', () => {
    it('kiểm tra mã khả dụng', () => {
      const check1 = service.checkCode('PROG-UNIQUE-123');
      expect(check1.isAvailable).toBe(true);

      const check2 = service.checkCode('PROG-FE01');
      expect(check2.isAvailable).toBe(false);

      // Cho phép mã trùng với chính excludeId (khi đang sửa chương trình đó)
      const checkSelf = service.checkCode('PROG-FE01', 'prog-1');
      expect(checkSelf.isAvailable).toBe(true);
    });
  });
});
