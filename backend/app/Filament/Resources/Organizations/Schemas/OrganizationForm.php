<?php

namespace App\Filament\Resources\Organizations\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class OrganizationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('plan')
                    ->required()
                    ->default('FREE'),
                Toggle::make('subscription_active')
                    ->required(),
                DateTimePicker::make('subscription_end'),
            ]);
    }
}
