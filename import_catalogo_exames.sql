-- ============================================
-- Importação do catálogo de exames
-- Execute no SQL Editor do Supabase
-- ============================================

INSERT INTO catalogo_exames (nome, codigo_tuss) VALUES
-- Hemograma e coagulação
('Hemograma completo', '40304361'),
('Hemoglobina glicada (HbA1c)', '40302040'),
('Coagulograma', '40304370'),
('Tempo de protrombina (TP)', '40304540'),
('Tempo de tromboplastina parcial (TTPa)', '40304558'),
('Velocidade de hemossedimentação (VHS)', '40304574'),
('Reticulócitos', '40304507'),
('Tipagem sanguínea ABO/Rh', '40304060'),

-- Bioquímica
('Glicemia de jejum', '40302016'),
('Glicemia pós-prandial', '40302024'),
('Curva glicêmica (TOTG 75g)', '40302059'),
('Colesterol total', '40301630'),
('HDL colesterol', '40301648'),
('LDL colesterol', '40301656'),
('VLDL colesterol', '40301664'),
('Triglicerídeos', '40301613'),
('Perfil lipídico completo', NULL),
('Ureia', '40301605'),
('Creatinina', '40301672'),
('Ácido úrico', '40301010'),
('TGO (AST)', '40301524'),
('TGP (ALT)', '40301532'),
('Gama GT (GGT)', '40301940'),
('Fosfatase alcalina', '40301907'),
('Bilirrubinas totais e frações', '40301150'),
('Proteínas totais e frações', '40301460'),
('Albumina', '40301028'),
('Amilase', '40301044'),
('Lipase', '40302300'),
('Lactato desidrogenase (LDH)', '40301290'),
('Creatinofosfoquinase (CPK)', '40301699'),
('CPK-MB', '40301702'),
('Troponina I', '40301591'),
('PCR (Proteína C Reativa)', '40301460'),
('PCR ultrassensível', '40301478'),
('Ferro sérico', '40301915'),
('Ferritina', '40301923'),
('Transferrina', '40301575'),
('Capacidade total de ligação do ferro (TIBC)', '40301583'),
('Cálcio sérico', '40301206'),
('Cálcio iônico', '40301214'),
('Fósforo sérico', '40301443'),
('Magnésio sérico', '40301338'),
('Potássio sérico', '40301451'),
('Sódio sérico', '40301508'),
('Cloro sérico', '40301222'),

-- Hormônios tireoidianos
('TSH', '40316360'),
('T4 livre', '40316319'),
('T3 livre', '40316289'),
('T3 total', '40316297'),
('T4 total', '40316327'),
('Anti-TPO (anticorpos antitireoperoxidase)', '40316050'),
('Anti-tireoglobulina', '40316076'),
('Tireoglobulina', '40316351'),

-- Hormônios diversos
('Cortisol basal', '40316130'),
('ACTH', '40316017'),
('Prolactina', '40316246'),
('FSH', '40316173'),
('LH', '40316211'),
('Estradiol', '40316165'),
('Progesterona', '40316238'),
('Testosterona total', '40316343'),
('Testosterona livre', '40316335'),
('DHEA-S', '40316149'),
('GH (Hormônio do crescimento)', '40316181'),
('IGF-1 (Somatomedina C)', '40316190'),
('PTH (Paratormônio)', '40316220'),
('Insulina basal', '40316203'),
('Peptídeo C', '40301419'),
('Beta-HCG quantitativo', '40302113'),
('PSA total', '40316254'),
('PSA livre', '40316262'),
('Vitamina D (25-OH)', '40302580'),
('Vitamina B12', '40302571'),
('Ácido fólico', '40302563'),

-- Urina e fezes
('Urina tipo I (EAS)', '40311023'),
('Urocultura com antibiograma', '40310060'),
('Urina 24 horas - proteínas', '40311040'),
('Urina 24 horas - creatinina', '40311058'),
('Microalbuminúria', '40311082'),
('Relação albumina/creatinina urinária', NULL),
('Parasitológico de fezes (EPF)', '40311104'),
('Sangue oculto nas fezes', '40311112'),
('Coprocultura', '40310027'),

-- Marcadores tumorais
('CEA (Antígeno carcinoembrionário)', '40305147'),
('CA 125', '40305082'),
('CA 19-9', '40305090'),
('CA 15-3', '40305074'),
('AFP (Alfa-fetoproteína)', '40305015'),

-- Sorologia / Infecções
('HIV (Anti-HIV 1 e 2)', '40307620'),
('VDRL', '40307735'),
('HBsAg (Hepatite B)', '40307484'),
('Anti-HBs (Hepatite B)', '40307492'),
('Anti-HBc total (Hepatite B)', '40307506'),
('Anti-HCV (Hepatite C)', '40307514'),
('Anti-HAV IgM (Hepatite A)', '40307468'),
('Anti-HAV IgG (Hepatite A)', '40307476'),
('Toxoplasmose IgG e IgM', '40307697'),
('Rubéola IgG e IgM', '40307689'),
('Citomegalovírus IgG e IgM', '40307204'),
('Dengue IgG e IgM', '40307301'),
('PCR para COVID-19', NULL),

-- Imunologia
('FAN (Fator antinuclear)', '40308081'),
('Fator reumatoide', '40308103'),
('Anti-CCP', '40308014'),
('Complemento C3', '40308030'),
('Complemento C4', '40308049'),
('Imunoglobulinas (IgA, IgG, IgM)', '40308146'),

-- Exames de imagem
('Radiografia de tórax PA e perfil', '40801012'),
('Radiografia de coluna cervical', '40801020'),
('Radiografia de coluna lombar', '40801047'),
('Radiografia de abdome', '40801063'),
('Radiografia de seios da face', '40801098'),
('Radiografia de mãos e punhos', NULL),
('Ultrassonografia de abdome total', '40901033'),
('Ultrassonografia de abdome superior', '40901041'),
('Ultrassonografia pélvica', '40901050'),
('Ultrassonografia transvaginal', '40901068'),
('Ultrassonografia de tireoide', '40901076'),
('Ultrassonografia de mamas', '40901084'),
('Ultrassonografia de próstata', '40901092'),
('Ultrassonografia obstétrica', '40901106'),
('Ultrassonografia de rins e vias urinárias', '40901114'),
('Ultrassonografia com Doppler de carótidas', '40901122'),
('Ultrassonografia com Doppler venoso de MMII', '40901130'),
('Ultrassonografia com Doppler arterial de MMII', '40901149'),
('Ecocardiograma transtorácico', '40901157'),
('Mamografia bilateral', '40902013'),
('Densitometria óssea', '40808025'),
('Tomografia de crânio', '41001010'),
('Tomografia de tórax', '41001028'),
('Tomografia de abdome e pelve', '41001036'),
('Tomografia de coluna lombar', '41001044'),
('Ressonância magnética de crânio', '41101014'),
('Ressonância magnética de coluna cervical', '41101022'),
('Ressonância magnética de coluna lombar', '41101030'),
('Ressonância magnética de joelho', '41101049'),
('Ressonância magnética de ombro', '41101057'),
('Angiotomografia de coronárias', '41001052'),

-- Cardiologia
('Eletrocardiograma (ECG)', '40401014'),
('Teste ergométrico (TE)', '40401022'),
('Holter 24 horas', '40401030'),
('MAPA 24 horas', '40401049'),
('Cintilografia miocárdica', '40501012'),

-- Oftalmologia
('Tonometria', '40503011'),
('Fundoscopia', '40503020'),
('Campimetria', '40503038'),
('Retinografia', '40503046'),

-- Gastroenterologia
('Endoscopia digestiva alta', '40201015'),
('Colonoscopia', '40201023'),

-- Pneumologia
('Espirometria', '40401057'),

-- Neurologia
('Eletroencefalograma (EEG)', '40401065'),
('Eletroneuromiografia (ENMG)', '40401073'),

-- Ginecologia
('Colpocitologia oncótica (Papanicolaou)', '40601013'),
('Colposcopia', '40601021'),

-- Outros
('Audiometria', '40503054'),
('Polissonografia', '40401081')

ON CONFLICT DO NOTHING;
