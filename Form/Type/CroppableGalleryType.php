<?php

namespace Comur\ImageBundle\Form\Type;

use Symfony\Component\Form\Extension\Core\Type\CollectionType;
use Symfony\Component\Form\FormView;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormBuilderInterface;

class CroppableGalleryType extends CroppableImageType
{
    protected bool $isGallery = true;
    protected int $galleryThumbSize;

    public function __construct(string $galleryDir, string $thumbsDir, int $galleryThumbSize)
    {
        $this->galleryDir = $galleryDir;
        $this->thumbsDir = $thumbsDir;
        $this->galleryThumbSize = $galleryThumbSize;
    }

    public function getBlockPrefix(): string
    {
        return 'comur_gallery';
    }

    /**
     * {@inheritdoc}
     */
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->add($builder->getName(), CollectionType::class, [
            'allow_add' => true,
            'allow_delete' => true,
            'entry_options' => [
                'attr' => array_merge($options['attr'] ?? [], [
                        'style' => 'opacity: 0;width: 0; max-width: 0; height: 0; max-height: 0;padding: 0; position: absolute;',
                    ]
                )
            ],
        ]);
    }

    /**
     * {@inheritdoc}
     */
    public function buildView(FormView $view, FormInterface $form, array $options): void
    {
        $uploadConfig = $options['uploadConfig'];
        $cropConfig = $options['cropConfig'];
        $uploadConfig['isGallery'] = true;

        $view->vars['options'] = [
            'uploadConfig' => $uploadConfig,
            'cropConfig' => $cropConfig,
            'galleryThumbSize' => $this->galleryThumbSize,
        ];
    }
}
