<?php

namespace App\Filament\Resources\Cycles\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\KeyValue;
use Filament\Schemas\Schema;

class CycleForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),
                TextInput::make('animal')
                    ->required(),
                TextInput::make('scale')
                    ->required()
                    ->numeric(),
                TextInput::make('mode')
                    ->required(),
                KeyValue::make('data')
                    ->columnSpanFull(),
                Select::make('org_id')
                    ->relationship('org', 'name')
                    ->required(),
            ]);
    }
}
