from django.core.management.base import BaseCommand
from scholarships.models import Scholarship, ScholarshipRequirement
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'Seeds the database with 20 realistic demo scholarships'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding 20 scholarships...')

        today = date.today()

        scholarships_data = [
            {
                'name': 'AICTE Pragati Scholarship for Girls',
                'provider': 'All India Council for Technical Education',
                'description': 'Empowering girls with technical education to advance in their careers. The scheme aims to provide assistance for advancement of girls pursuing technical education.',
                'amount': 50000.00,
                'deadline': today + timedelta(days=25),
                'application_url': 'https://scholarships.gov.in',
                'category': 'Women',
                'scholarship_type': 'Government',
                'provider_type': 'Central Government',
                'official_source': True,
                'requirements': {
                    'course': 'B.Tech, B.E., Diploma',
                    'education_level': 'Undergraduate',
                    'gender_eligibility': 'Female',
                    'max_income': 800000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,BANK_DOC'
                }
            },
            {
                'name': 'National Merit Scholarship Scheme',
                'provider': 'Ministry of Education',
                'description': 'Financial assistance to meritorious students from low income families to meet a part of their day-to-day expenses while pursuing higher studies.',
                'amount': 25000.00,
                'deadline': today + timedelta(days=12),
                'application_url': 'https://scholarships.gov.in',
                'category': 'Merit',
                'scholarship_type': 'Government',
                'provider_type': 'Central Government',
                'official_source': True,
                'requirements': {
                    'min_cgpa': 8.0,
                    'max_income': 250000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,DOMICILE_CERT,BANK_DOC'
                }
            },
            {
                'name': 'Tech Mahindra Foundation Engineering Excellence Grant',
                'provider': 'Tech Mahindra Foundation',
                'description': 'Supporting students pursuing degrees in Computer Science and Information Technology who demonstrate both academic excellence and financial need.',
                'amount': 60000.00,
                'deadline': today + timedelta(days=40),
                'application_url': 'https://techmahindrafoundation.org',
                'category': 'CSE',
                'scholarship_type': 'Private',
                'provider_type': 'Private Organization',
                'official_source': True,
                'requirements': {
                    'course': 'B.Tech CSE, B.Tech IT, BCA',
                    'min_cgpa': 7.5,
                    'max_income': 500000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,BANK_DOC'
                }
            },
            {
                'name': 'Post Matric Scholarship for SC/ST Students',
                'provider': 'Ministry of Social Justice & Empowerment',
                'description': 'Provides financial assistance to the Scheduled Caste and Scheduled Tribe students studying at post matriculation or post-secondary stage to enable them to complete their education.',
                'amount': 30000.00,
                'deadline': today + timedelta(days=50),
                'application_url': 'https://scholarships.gov.in',
                'category': 'Category',
                'scholarship_type': 'Government',
                'provider_type': 'Central Government',
                'official_source': True,
                'requirements': {
                    'category_eligibility': 'SC, ST',
                    'max_income': 250000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,CASTE_CERT,BANK_DOC'
                }
            },
            {
                'name': 'State Merit Scholarship (Andhra Pradesh)',
                'provider': 'Government of Andhra Pradesh',
                'description': 'Awarded to top-performing students in the state board examinations to pursue undergraduate degree programs.',
                'amount': 20000.00,
                'deadline': today + timedelta(days=8),
                'application_url': 'https://jnanabhumi.ap.gov.in',
                'category': 'State',
                'scholarship_type': 'Government',
                'provider_type': 'State Government',
                'official_source': True,
                'requirements': {
                    'state_eligibility': 'Andhra Pradesh',
                    'min_cgpa': 8.5,
                    'required_documents': 'ID_PROOF,MARKSHEET,DOMICILE_CERT,BANK_DOC'
                }
            },
            {
                'name': 'Reliance Foundation Undergraduate Scholarship',
                'provider': 'Reliance Foundation',
                'description': 'Supporting meritorious undergraduate students across India with financial support and leadership development opportunities.',
                'amount': 200000.00,
                'deadline': today + timedelta(days=35),
                'application_url': 'https://scholarships.reliancefoundation.org',
                'category': 'Need-based',
                'scholarship_type': 'Private',
                'provider_type': 'Private Foundation',
                'official_source': True,
                'requirements': {
                    'min_cgpa': 7.0,
                    'max_income': 1500000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,BONAFIDE,BANK_DOC'
                }
            },
            {
                'name': 'Sitaram Jindal Foundation Merit & Need Scholarship',
                'provider': 'Sitaram Jindal Foundation',
                'description': 'Monetary assistance for poor and deserving students pursuing B.Tech, B.Sc, B.Com, or Diploma courses.',
                'amount': 36000.00,
                'deadline': today + timedelta(days=18),
                'application_url': 'https://sitaramjindalfoundation.org',
                'category': 'Need-based',
                'scholarship_type': 'Private',
                'provider_type': 'Private Trust',
                'official_source': True,
                'requirements': {
                    'max_income': 400000.00,
                    'min_cgpa': 6.5,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,BANK_DOC'
                }
            },
            {
                'name': 'AICTE Saksham Scholarship for Differently Abled',
                'provider': 'All India Council for Technical Education',
                'description': 'Targeted financial support to differently-abled students for pursuing technical education in approved colleges.',
                'amount': 50000.00,
                'deadline': today + timedelta(days=45),
                'application_url': 'https://scholarships.gov.in',
                'category': 'Category',
                'scholarship_type': 'Government',
                'provider_type': 'Central Government',
                'official_source': True,
                'requirements': {
                    'max_income': 800000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,DISABILITY_CERT,BANK_DOC'
                }
            },
            {
                'name': 'KVPY Fellowships for Basic Sciences',
                'provider': 'Department of Science and Technology (DST)',
                'description': 'National Fellowship program initiated to encourage exceptionally talented students to take up research careers in basic sciences.',
                'amount': 84000.00,
                'deadline': today + timedelta(days=60),
                'application_url': 'http://kvpy.iisc.ernet.in',
                'category': 'National',
                'scholarship_type': 'Government',
                'provider_type': 'Central Government',
                'official_source': True,
                'requirements': {
                    'min_cgpa': 9.0,
                    'required_documents': 'ID_PROOF,MARKSHEET,COLLEGE_ID,BANK_DOC'
                }
            },
            {
                'name': 'Maharashtra Rajarshi Chhatrapati Shahu Maharaj Scheme',
                'provider': 'Government of Maharashtra',
                'description': 'Reimbursement of tuition fee for economically backward class students studying in professional and higher education courses.',
                'amount': 45000.00,
                'deadline': today + timedelta(days=14),
                'application_url': 'https://mahadbt.maharashtra.gov.in',
                'category': 'State',
                'scholarship_type': 'Government',
                'provider_type': 'State Government',
                'official_source': True,
                'requirements': {
                    'state_eligibility': 'Maharashtra',
                    'max_income': 800000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,DOMICILE_CERT,FEE_RECEIPT,BANK_DOC'
                }
            },
            {
                'name': 'Tata Trusts Medical & Higher Education Grant',
                'provider': 'Tata Trusts',
                'description': 'Financial support to students pursuing undergraduate and postgraduate degrees in Engineering, Medical, and Healthcare fields.',
                'amount': 75000.00,
                'deadline': today + timedelta(days=30),
                'application_url': 'https://tatatrusts.org',
                'category': 'Engineering',
                'scholarship_type': 'Private',
                'provider_type': 'Private Trust',
                'official_source': True,
                'requirements': {
                    'course': 'B.Tech, BE, MBBS, BDS',
                    'min_cgpa': 7.5,
                    'max_income': 600000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,FEE_RECEIPT,BANK_DOC'
                }
            },
            {
                'name': 'Kotak Kanya Scholarship for Female STEM Students',
                'provider': 'Kotak Education Foundation',
                'description': 'Assistance for meritorious girl students from underprivileged families to pursue professional graduation courses from reputed institutes.',
                'amount': 150000.00,
                'deadline': today + timedelta(days=22),
                'application_url': 'https://kotakeducation.org',
                'category': 'Women',
                'scholarship_type': 'Private',
                'provider_type': 'Private Foundation',
                'official_source': True,
                'requirements': {
                    'gender_eligibility': 'Female',
                    'min_cgpa': 8.5,
                    'max_income': 600000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,COLLEGE_ID,BANK_DOC'
                }
            },
            {
                'name': 'Central Sector Scheme of Scholarships for University Students',
                'provider': 'Ministry of Education',
                'description': 'Provides financial support to top 80,000 university students across India based on 12th Board examination percentile.',
                'amount': 20000.00,
                'deadline': today + timedelta(days=5),
                'application_url': 'https://scholarships.gov.in',
                'category': 'National',
                'scholarship_type': 'Government',
                'provider_type': 'Central Government',
                'official_source': True,
                'requirements': {
                    'min_cgpa': 8.0,
                    'max_income': 450000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,BANK_DOC'
                }
            },
            {
                'name': 'HDFC Bank Parivartan Educational Crisis Scholarship',
                'provider': 'HDFC Bank Parivartan',
                'description': 'Designed for students facing personal or family crises to prevent dropouts and ensure continuity of education.',
                'amount': 50000.00,
                'deadline': today + timedelta(days=19),
                'application_url': 'https://hdfcbank.com/parivartan',
                'category': 'Need-based',
                'scholarship_type': 'Private',
                'provider_type': 'Private Corporate',
                'official_source': True,
                'requirements': {
                    'max_income': 600000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,BANK_DOC'
                }
            },
            {
                'name': 'Foundation for Excellence (FFE) Engineering Scholarship',
                'provider': 'Foundation for Excellence',
                'description': 'Full financial support and mentoring for bright first-year BE/B.Tech students from economically challenged backgrounds.',
                'amount': 50000.00,
                'deadline': today + timedelta(days=28),
                'application_url': 'https://ffe.org',
                'category': 'Engineering',
                'scholarship_type': 'Private',
                'provider_type': 'Private Trust',
                'official_source': True,
                'requirements': {
                    'course': 'B.Tech, B.E.',
                    'min_cgpa': 7.0,
                    'max_income': 300000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,BONAFIDE,BANK_DOC'
                }
            },
            {
                'name': 'Post Matric Scholarship for OBC Students',
                'provider': 'Ministry of Social Justice & Empowerment',
                'description': 'Financial assistance for Other Backward Class students at post-secondary stage to enable them to complete higher education.',
                'amount': 22000.00,
                'deadline': today + timedelta(days=40),
                'application_url': 'https://scholarships.gov.in',
                'category': 'Category',
                'scholarship_type': 'Government',
                'provider_type': 'Central Government',
                'official_source': True,
                'requirements': {
                    'category_eligibility': 'OBC',
                    'max_income': 250000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,CASTE_CERT,BANK_DOC'
                }
            },
            {
                'name': 'Google Women Techmakers Scholar Program India',
                'provider': 'Google',
                'description': 'Created to further Dr. Anita Borg\'s vision of establishing gender equality in computer science and technology by encouraging female leaders.',
                'amount': 100000.00,
                'deadline': today + timedelta(days=55),
                'application_url': 'https://buildyourfuture.withgoogle.com',
                'category': 'CSE',
                'scholarship_type': 'Private',
                'provider_type': 'Private Corporate',
                'official_source': True,
                'requirements': {
                    'gender_eligibility': 'Female',
                    'course': 'B.Tech CSE, B.Tech IT, M.Tech CSE',
                    'min_cgpa': 8.0,
                    'required_documents': 'ID_PROOF,MARKSHEET,COLLEGE_ID,BANK_DOC'
                }
            },
            {
                'name': 'L&T Build India Scholarship for Civil & Mechanical Engineers',
                'provider': 'Larsen & Toubro Ltd',
                'description': 'Sponsorship for M.Tech in Construction Technology & Management along with employment opportunities at L&T.',
                'amount': 135000.00,
                'deadline': today + timedelta(days=32),
                'application_url': 'https://lntecc.com',
                'category': 'Engineering',
                'scholarship_type': 'Private',
                'provider_type': 'Private Corporate',
                'official_source': True,
                'requirements': {
                    'course': 'B.Tech Civil, B.Tech Electrical, B.Tech Mechanical',
                    'min_cgpa': 7.5,
                    'required_documents': 'ID_PROOF,MARKSHEET,BONAFIDE,BANK_DOC'
                }
            },
            {
                'name': 'ONGC Merit Scholarship for SC/ST and OBC Students',
                'provider': 'Oil and Natural Gas Corporation (ONGC)',
                'description': 'Financial support to deserving SC, ST, and OBC students pursuing Engineering, Geology, Geophysics, and MBA courses.',
                'amount': 48000.00,
                'deadline': today + timedelta(days=21),
                'application_url': 'https://ongcindia.com',
                'category': 'Merit',
                'scholarship_type': 'Government',
                'provider_type': 'Public Sector Undertaking',
                'official_source': True,
                'requirements': {
                    'category_eligibility': 'SC, ST, OBC',
                    'min_cgpa': 7.0,
                    'max_income': 450000.00,
                    'required_documents': 'ID_PROOF,MARKSHEET,INCOME_CERT,CASTE_CERT,BANK_DOC'
                }
            },
            {
                'name': 'Prime Minister\'s Scholarship Scheme for Central Armed Forces (PMSS)',
                'provider': 'Welfare and Rehabilitation Board, MHA',
                'description': 'Encouraging higher technical and professional education for dependent wards and widows of CAPFs & Assam Rifles personnel.',
                'amount': 36000.00,
                'deadline': today + timedelta(days=16),
                'application_url': 'https://scholarships.gov.in',
                'category': 'National',
                'scholarship_type': 'Government',
                'provider_type': 'Central Government',
                'official_source': True,
                'requirements': {
                    'min_cgpa': 6.0,
                    'required_documents': 'ID_PROOF,MARKSHEET,BONAFIDE,BANK_DOC'
                }
            }
        ]

        for data in scholarships_data:
            req_data = data.pop('requirements')
            scholarship, created = Scholarship.objects.get_or_create(name=data['name'], defaults=data)
            if created:
                ScholarshipRequirement.objects.create(scholarship=scholarship, **req_data)
                self.stdout.write(self.style.SUCCESS(f'Created scholarship: {scholarship.name}'))
            else:
                # Update existing fields
                for k, v in data.items():
                    setattr(scholarship, k, v)
                scholarship.save()
                if hasattr(scholarship, 'requirements'):
                    for rk, rv in req_data.items():
                        setattr(scholarship.requirements, rk, rv)
                    scholarship.requirements.save()
                else:
                    ScholarshipRequirement.objects.create(scholarship=scholarship, **req_data)
                self.stdout.write(self.style.WARNING(f'Updated scholarship: {scholarship.name}'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded 20 scholarships.'))

