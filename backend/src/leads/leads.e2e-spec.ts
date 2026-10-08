import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module';
import { DUPLICATE_PHONE_MESSAGE } from './leads.service';

const as = (id: string, roles: string) => ({ 'x-user-id': id, 'x-user-roles': roles });
const ADMISSIONS = as('tvts-1', 'ADMISSIONS');
const TRAINING_MANAGER = as('qldt-1', 'TRAINING_MANAGER');
const ADMIN = as('admin-1', 'ADMIN');

const validLead = {
  fullName: 'Nguyễn Thị Lan',
  phone: '0987654321',
  email: 'lan@gmail.com',
  source: 'FACEBOOK',
  interestedProgram: 'ReactJS',
};

describe('S2-09 Quản lý danh sách lead (/leads)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  /** Mỗi test dùng số điện thoại riêng để không dính cảnh báo trùng của test khác. */
  let phoneSeq = 900000000;
  const nextPhone = () => `0${++phoneSeq}`;

  const createLead = async (overrides: Record<string, unknown> = {}) => {
    const res = await http()
      .post('/leads')
      .set(ADMISSIONS)
      .send({ ...validLead, phone: nextPhone(), ...overrides })
      .expect(201);
    return res.body as { lead: { id: string; phone: string }; duplicateWarning: unknown };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => app.close());

  describe('AC1: tạo và sửa lead với họ tên, số điện thoại, email, nguồn, chương trình quan tâm', () => {
    it('tạo lead đủ 5 trường, chuẩn hoá dữ liệu', async () => {
      const res = await http()
        .post('/leads')
        .set(ADMISSIONS)
        .send({
          fullName: '  Nguyễn   Thị  Lan ',
          phone: '+84 912.000.001',
          email: ' Lan@Gmail.COM ',
          source: 'facebook',
          interestedProgram: ' ReactJS ',
        })
        .expect(201);

      expect(res.body.duplicateWarning).toBeNull();
      expect(res.body.lead).toMatchObject({
        fullName: 'Nguyễn Thị Lan',
        phone: '0912000001',
        email: 'lan@gmail.com',
        source: 'FACEBOOK',
        interestedProgram: 'ReactJS',
      });
      expect(res.body.lead.id).toEqual(expect.any(String));

      const detail = await http().get(`/leads/${res.body.lead.id}`).set(ADMISSIONS).expect(200);
      expect(detail.body).toEqual(res.body.lead);
    });

    it('email không bắt buộc', async () => {
      const { lead } = await createLead({ email: '' });
      expect(lead).toMatchObject({ email: null });
      const noEmail = await createLead({ email: undefined });
      expect(noEmail.lead).toMatchObject({ email: null });
    });

    it('thiếu hoặc sai trường bắt buộc → 400 VALIDATION_ERROR, chỉ rõ từng trường', async () => {
      const res = await http().post('/leads').set(ADMISSIONS).send({ email: 'sai-email' }).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(Object.keys(res.body.errors).sort()).toEqual(
        ['email', 'fullName', 'interestedProgram', 'phone', 'source'].sort(),
      );

      const badSource = await http()
        .post('/leads')
        .set(ADMISSIONS)
        .send({ ...validLead, phone: nextPhone(), source: 'TIKTOK' })
        .expect(400);
      expect(badSource.body.errors.source).toContain('FACEBOOK, WEBSITE, REFERRAL, GOOGLE_ADS');

      await http().post('/leads').set(ADMISSIONS).send({ ...validLead, phone: '12345' }).expect(400);
      await http().post('/leads').set(ADMISSIONS).send([validLead]).expect(400);
    });

    it('không nhận trường lạ (id, createdAt…)', async () => {
      const res = await http()
        .post('/leads')
        .set(ADMISSIONS)
        .send({ ...validLead, phone: nextPhone(), id: 'tu-dat-id' })
        .expect(400);
      expect(res.body.errors.id).toBeDefined();
    });

    it('sửa lead: chỉ đổi các trường gửi lên', async () => {
      const { lead } = await createLead();
      const res = await http()
        .patch(`/leads/${lead.id}`)
        .set(ADMISSIONS)
        .send({ source: 'WEBSITE', interestedProgram: 'Java Backend', email: null })
        .expect(200);

      expect(res.body.duplicateWarning).toBeNull();
      expect(res.body.lead).toMatchObject({
        id: lead.id,
        fullName: validLead.fullName,
        phone: lead.phone,
        email: null,
        source: 'WEBSITE',
        interestedProgram: 'Java Backend',
      });
    });

    it('sửa với dữ liệu sai, body rỗng hoặc lead không tồn tại', async () => {
      const { lead } = await createLead();
      const bad = await http().patch(`/leads/${lead.id}`).set(ADMISSIONS).send({ fullName: 'A' }).expect(400);
      expect(bad.body.errors.fullName).toBeDefined();
      await http().patch(`/leads/${lead.id}`).set(ADMISSIONS).send({}).expect(400);
      const missing = await http().patch('/leads/khong-co').set(ADMISSIONS).send({ source: 'WEBSITE' }).expect(404);
      expect(missing.body.code).toBe('LEAD_NOT_FOUND');
    });

    it('danh sách: mới nhất trước, có tổng số và phân trang (mặc định 20)', async () => {
      const first = await createLead({ fullName: 'Lead cũ hơn' });
      const second = await createLead({ fullName: 'Lead mới hơn' });

      const page = await http().get('/leads').set(ADMISSIONS).expect(200);
      expect(page.body.pageSize).toBe(20);
      expect(page.body.total).toBeGreaterThanOrEqual(2);
      const ids = page.body.items.map((item: { id: string }) => item.id);
      expect(ids.indexOf(second.lead.id)).toBeLessThan(ids.indexOf(first.lead.id));

      const small = await http().get('/leads?page=1&pageSize=1').set(ADMISSIONS).expect(200);
      expect(small.body.items).toHaveLength(1);
      expect(small.body.totalPages).toBe(small.body.total);

      await http().get('/leads?pageSize=0').set(ADMISSIONS).expect(400);
      await http().get('/leads?page=abc').set(ADMISSIONS).expect(400);
    });
  });

  describe('AC2: cảnh báo khi số điện thoại trùng lead đã có (chỉ cảnh báo, vẫn lưu)', () => {
    it('tạo lead trùng số → vẫn lưu, trả cảnh báo kèm lead bị trùng', async () => {
      const phone = nextPhone();
      const original = await createLead({ phone, fullName: 'Trần Thị Bình' });

      const res = await http()
        .post('/leads')
        .set(ADMISSIONS)
        .send({ ...validLead, phone: `+84${phone.slice(1)}` })
        .expect(201);

      expect(res.body.lead.phone).toBe(phone);
      expect(res.body.duplicateWarning).toEqual({
        message: DUPLICATE_PHONE_MESSAGE,
        duplicates: [{ id: original.lead.id, fullName: 'Trần Thị Bình', phone }],
      });
      await http().get(`/leads/${res.body.lead.id}`).set(ADMISSIONS).expect(200);
    });

    it('sửa lead: giữ nguyên số của chính mình không bị cảnh báo; đổi sang số của lead khác thì cảnh báo', async () => {
      const a = await createLead();
      const b = await createLead();

      const self = await http().patch(`/leads/${a.lead.id}`).set(ADMISSIONS).send({ phone: a.lead.phone }).expect(200);
      expect(self.body.duplicateWarning).toBeNull();

      const clash = await http().patch(`/leads/${a.lead.id}`).set(ADMISSIONS).send({ phone: b.lead.phone }).expect(200);
      expect(clash.body.lead.phone).toBe(b.lead.phone);
      expect(clash.body.duplicateWarning.duplicates).toEqual([expect.objectContaining({ id: b.lead.id })]);
    });

    it('GET /leads/check-phone: báo trùng trước khi lưu, bỏ qua lead đang sửa', async () => {
      const { lead } = await createLead();

      const hit = await http().get(`/leads/check-phone?phone=${lead.phone}`).set(ADMISSIONS).expect(200);
      expect(hit.body.duplicateWarning.message).toBe(DUPLICATE_PHONE_MESSAGE);

      const editingSelf = await http()
        .get(`/leads/check-phone?phone=${lead.phone}&excludeId=${lead.id}`)
        .set(ADMISSIONS)
        .expect(200);
      expect(editingSelf.body.duplicateWarning).toBeNull();

      const free = await http().get(`/leads/check-phone?phone=${nextPhone()}`).set(ADMISSIONS).expect(200);
      expect(free.body.duplicateWarning).toBeNull();

      await http().get('/leads/check-phone?phone=abc').set(ADMISSIONS).expect(400);
    });
  });

  describe('AC3: chỉ Quản lý đào tạo được xoá lead', () => {
    it('TRAINING_MANAGER xoá được: lead biến mất khỏi danh sách', async () => {
      const { lead } = await createLead();
      const res = await http().delete(`/leads/${lead.id}`).set(TRAINING_MANAGER).expect(200);
      expect(res.body).toEqual({ id: lead.id });
      await http().get(`/leads/${lead.id}`).set(ADMISSIONS).expect(404);
    });

    it.each([
      ['ADMISSIONS', ADMISSIONS],
      ['ADMIN', ADMIN],
      ['INSTRUCTOR', as('gv-1', 'INSTRUCTOR')],
      ['ACCOUNTANT', as('kt-1', 'ACCOUNTANT')],
    ])('%s bị từ chối xoá (403) và lead vẫn còn', async (_role, headers) => {
      const { lead } = await createLead();
      const res = await http().delete(`/leads/${lead.id}`).set(headers).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
      await http().get(`/leads/${lead.id}`).set(ADMISSIONS).expect(200);
    });

    it('xoá lead không tồn tại → 404', async () => {
      const res = await http().delete('/leads/khong-co').set(TRAINING_MANAGER).expect(404);
      expect(res.body.code).toBe('LEAD_NOT_FOUND');
    });
  });

  describe('phân quyền xem / tạo / sửa', () => {
    it('chưa đăng nhập → 401', async () => {
      await http().get('/leads').expect(401);
    });

    it('vai trò ngoài tuyển sinh không xem, không tạo được lead', async () => {
      await http().get('/leads').set(as('gv-1', 'INSTRUCTOR')).expect(403);
      await http().post('/leads').set(as('hv-1', 'STUDENT')).send({ ...validLead, phone: nextPhone() }).expect(403);
    });

    it('Quản lý đào tạo xem được danh sách để xoá, nhưng không tạo/sửa', async () => {
      const { lead } = await createLead();
      await http().get('/leads').set(TRAINING_MANAGER).expect(200);
      await http().post('/leads').set(TRAINING_MANAGER).send({ ...validLead, phone: nextPhone() }).expect(403);
      await http().patch(`/leads/${lead.id}`).set(TRAINING_MANAGER).send({ source: 'WEBSITE' }).expect(403);
    });
  });
});
